"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getPromotions() {
  try {
    return await prisma.promotion.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching promotions:", error);
    return [];
  }
}

export async function createPromotion(data: {
  code: string;
  description: string;
  type: string;
  discount: number;
}) {
  try {
    const promotion = await prisma.promotion.create({
      data: {
        code: data.code,
        description: data.description,
        type: data.type,
        discount: data.discount,
      },
    });
    revalidatePath("/dashboard/promotions");
    return { success: true, data: promotion };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deletePromotion(id: string) {
  try {
    await prisma.promotion.delete({
      where: { id },
    });
    revalidatePath("/dashboard/promotions");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getPromotionByCode(code: string) {
  try {
    const promo = await prisma.promotion.findUnique({
      where: { code, status: "ACTIVE" },
    });
    return { success: !!promo, data: promo };
  } catch (error) {
    return { success: false, error: "Error de servidor" };
  }
}
