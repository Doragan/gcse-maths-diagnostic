import { DiagnosticEngine } from "@/lib/diagnostic/DiagnosticEngine";
import { NextResponse } from "next/server";

const engine = new DiagnosticEngine();

export async function GET() {

  return NextResponse.json({
    message: "Diagnostic API running"
  });

}

export async function POST(req: Request) {

  const { session, skillId, answer } = await req.json();

  const updatedSession = engine.submitAnswer(
    session,
    skillId,
    answer
  );

  const nextSkill = engine.getNextSkill(updatedSession);

  return NextResponse.json({
    session: updatedSession,
    nextSkill
  });
}