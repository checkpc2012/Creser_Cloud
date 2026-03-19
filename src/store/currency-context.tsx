"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getLiveCurrencyRates } from '@/app/actions/currency-actions';

type Currency = 'UYU' | 'USD';
type Bank = 'BCU' | 'BROU';
type Trend = 'up' | 'down' | 'flat';

interface ExchangeRate {
  buy: number;
  sell: number;
}

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  exchangeRate: number; // Derived: rates[bank].sell
  rates: {
    BCU: ExchangeRate;
    BROU: ExchangeRate;
  };
  bank: Bank;
  setBank: (bank: Bank) => void;
  isLoading: boolean;
  trend: Trend;
  refreshRates: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const DEFAULT_RATES = {
  BCU: { buy: 39.50, sell: 42.10 },
  BROU: { buy: 39.60, sell: 42.30 }
};

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<Currency>('UYU');
  const [bank, setBank] = useState<Bank>('BCU');
  const [rates, setRates] = useState(DEFAULT_RATES);
  const [isLoading, setIsLoading] = useState(false);
  const [trend, setTrend] = useState<Trend>('flat');

  const fetchRates = async () => {
    setIsLoading(true);
    try {
      const res = await getLiveCurrencyRates();
      
      if (res.success && res.data) {
        const newRates = {
          BCU: res.data.BCU,
          BROU: res.data.BROU
        };

        // Lógica de tendencia basada en la venta del banco seleccionado
        if (typeof window !== 'undefined') {
          const prev = localStorage.getItem('prev_rate_sell');
          if (prev) {
            const prevNum = parseFloat(prev);
            const currentSell = newRates[bank].sell;
            if (currentSell > prevNum) setTrend('up');
            else if (currentSell < prevNum) setTrend('down');
            else setTrend('flat');
          }
          localStorage.setItem('prev_rate_sell', newRates[bank].sell.toString());
        }

        setRates(newRates);
      }
    } catch (error) {
      console.error("Error fetching rates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
    const interval = setInterval(fetchRates, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [bank]);

  const exchangeRate = rates[bank].sell;

  return (
    <CurrencyContext.Provider value={{ 
      currency, 
      setCurrency, 
      exchangeRate,
      rates, 
      bank, 
      setBank, 
      isLoading, 
      trend,
      refreshRates: fetchRates
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error("useCurrency must be used within CurrencyProvider");
  return context;
}
