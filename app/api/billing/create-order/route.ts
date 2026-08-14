import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

export const PRO_PLAN = {
  id: "PRO",
  label: "octa-studio PRO",
  amountINR: 999,
  amountPaise: 999 * 100,
  currency: "INR",
};

export async function POST(request: NextRequest) {
  try {
    const userId = getSessionUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Sign in to purchase an AI subscription." },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const plan = String(body.plan || "PRO");
    if (plan !== PRO_PLAN.id) {
      return NextResponse.json({ error: "Unknown plan." }, { status: 400 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const simulated = !keyId || !keySecret;

    let orderId: string;

    if (!simulated) {
      const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: PRO_PLAN.amountPaise,
          currency: PRO_PLAN.currency,
          receipt: `octa-${userId.slice(0, 8)}-${Date.now()}`,
        }),
      });

      if (!orderRes.ok) {
        console.error("[billing] razorpay order failed:", await orderRes.text());
        return NextResponse.json({ error: "Payment provider rejected the order. Try again." }, { status: 502 });
      }

      const order = await orderRes.json();
      orderId = String(order.id);
    } else {
      // No Razorpay keys configured: run in test mode so the flow still works.
      orderId = `order_sim_${Date.now()}`;
    }

    await prisma.payment.create({
      data: {
        userId,
        plan,
        amount: PRO_PLAN.amountINR,
        currency: PRO_PLAN.currency,
        status: "PENDING",
        razorpayOrderId: orderId,
        mode: simulated ? "simulated" : "razorpay",
      },
    });

    return NextResponse.json({
      orderId,
      keyId: keyId || "",
      amount: PRO_PLAN.amountPaise,
      currency: PRO_PLAN.currency,
      plan,
      amountLabel: `₹${PRO_PLAN.amountINR}`,
      simulated,
    });
  } catch (error) {
    console.error("[billing] create-order error:", error);
    return NextResponse.json({ error: "Could not start the payment. Try again." }, { status: 500 });
  }
}
