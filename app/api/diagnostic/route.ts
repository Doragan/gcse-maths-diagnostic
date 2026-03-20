import { createDiagnostic, answerSkill, getCurrentSkill } from "@/lib/diagnostic/diagnosticEngine";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "Diagnostic API running",
  });
}

export async function POST(req: Request) {
  const { session, skillId, answer } = await req.json();

  // Update the session with the answer
  const updatedSession = answerSkill(session, skillId, answer);

  // Get the next skill
  const nextSkill = getCurrentSkill(updatedSession);

  return NextResponse.json({
    session: updatedSession,
    nextSkill,
  });
}