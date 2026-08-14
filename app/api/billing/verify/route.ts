import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const userId = getSessionUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Sign in to purchase an AI subscription." }, { status: 401 });
    }

    const body = await request.json();
    const orderId = String(body.orderId || "");
    const paymentId = String(body.paymentId || "pay_simulated");
    const signature = String(body.signature || "");

    const payment = await prisma.payment.findFirst({
      where: { razorpayOrderId: orderId, userId },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment order not found." }, { status: 404 });
    }

    if (payment.mode !== "simulated") {
      const secret = process.env.RAZORPAY_KEY_SECRET;
      if (!secret) {
        return NextResponse.json({ error: "Payment verification is not configured." }, { status: 500 });
      }
      const expected = createHmac("sha256", secret)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");
      const a = Buffer.from(expected, "hex");
      const b = Buffer.from(signature, "hex");
      if (a.length !== b.length || !timingSafeEqual(a, b)) {
        return NextResponse.json({ error: "Payment signature verification failed." }, { status: 400 });
      }
    }

    const [updatedPayment, user] = await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: "PAID", razorpayPaymentId: paymentId },
      }),
      prisma.user.update({ where: { id: userId }, data: { plan: payment.plan } }),
    ]);

    return NextResponse.json({
      success: true,
      plan: updatedPayment.plan,
      user: { id: user.id, email: user.email, name: user.name, plan: user.plan },
    });
  } catch (error) {
    console.error("[billing] verify error:", error);
    return NextResponse.json({ error: "Payment verification failed. Try again." }, { status: 500 });
  }
}
