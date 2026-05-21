import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    { message: "Reset password - a implementer au Prompt 03" },
    { status: 501 }
  )
}
