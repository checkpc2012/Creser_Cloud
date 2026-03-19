
"use server";

import { revalidatePath } from "next/cache";

interface ExchangeRate {
  buy: number;
  sell: number;
  lastUpdate: string;
}

export async function getLiveCurrencyRates() {
  try {
    const results: any = {
      BROU: { buy: 39.10, sell: 41.70, lastUpdate: new Date().toISOString() },
      BCU: { buy: 40.32, sell: 40.32, lastUpdate: new Date().toISOString() }
    };

    // 1. Fetch BROU
    try {
      const brouRes = await fetch("https://www.brou.com.uy/cotizaciones", { 
        next: { revalidate: 900 }, // 15 min cache
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
      });
      const brouHtml = await brouRes.text();
      
      // Intentamos extraer Dólar e-BROU (que suele ser el preferencial)
      // Buscamos la fila que contiene "Dólar e-BROU"
      // El formato suele ser: <td>Dólar e-BROU</td> <td>39,600</td> <td>41,200</td>
      const ebrouMatch = brouHtml.match(/Dólar e-BROU[\s\S]*?(\d+,\d+)[\s\S]*?(\d+,\d+)/);
      if (ebrouMatch) {
        results.BROU.buy = parseFloat(ebrouMatch[1].replace(',', '.'));
        results.BROU.sell = parseFloat(ebrouMatch[2].replace(',', '.'));
      } else {
        // Si no, probamos con Dólar Billete
        const billeteMatch = brouHtml.match(/Dólar Billete[\s\S]*?(\d+,\d+)[\s\S]*?(\d+,\d+)/);
        if (billeteMatch) {
          results.BROU.buy = parseFloat(billeteMatch[1].replace(',', '.'));
          results.BROU.sell = parseFloat(billeteMatch[2].replace(',', '.'));
        }
      }
    } catch (e) {
      console.error("Error scraping BROU:", e);
    }

    // 2. Fetch BCU
    try {
      const bcuRes = await fetch("https://www.bcu.gub.uy/Estadisticas-e-Indicadores/Paginas/Cotizaciones.aspx", {
        next: { revalidate: 900 },
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
      });
      const bcuHtml = await bcuRes.text();
      // Buscamos "DLS. USA BILLETE"
      const bcuMatch = bcuHtml.match(/DLS\. USA BILLETE[\s\S]*?(\d+,\d+)/);
      if (bcuMatch) {
        const rate = parseFloat(bcuMatch[1].replace(',', '.'));
        results.BCU.buy = rate;
        results.BCU.sell = rate;
      }
    } catch (e) {
      console.error("Error scraping BCU:", e);
    }

    return { success: true, data: results };
  } catch (error) {
    console.error("Global Error fetching rates:", error);
    return { success: false, error: "No se pudieron obtener las cotizaciones reales" };
  }
}
