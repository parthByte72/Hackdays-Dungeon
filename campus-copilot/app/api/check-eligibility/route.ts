import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const schema = {
  type: "object",
  properties: {
    overall_status: {
      type: "string",
      enum: ["potentially_eligible", "needs_verification", "does_not_meet_requirements"],
    },
    summary: { type: "string" },
    checks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          requirement: { type: "string" },
          status: {
            type: "string",
            enum: ["meets_requirement", "needs_verification", "does_not_meet"],
          },
          explanation: { type: "string" },
        },
        required: ["requirement", "status", "explanation"],
      },
    },
    documents: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          status: {
            type: "string",
            enum: ["required", "conditional", "not_applicable", "needs_verification"],
          },
          reason: { type: "string" },
        },
        required: ["name", "status", "reason"],
      },
    },
    important_actions: { type: "array", items: { type: "string" } },
  },
  required: ["overall_status", "summary", "checks", "documents", "important_actions"],
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const scholarship = body.scholarship;
    const student = body.student;

    if (!scholarship || !student) {
      return NextResponse.json(
        { error: "Scholarship data and student profile are required." },
        { status: 400 }
      );
    }

    const response = await ai.interactions.create({
      model: "gemini-3.8-flash",
      input: [
        {
          type: "text",
          text: `
Compare the student's details with the scholarship information below.
Use only the supplied notice. Do not invent rules. If the notice does not give enough information to decide something, use "needs_verification". Explain the reason for each check and list the documents that apply to this student.

STUDENT:
${JSON.stringify(student, null, 2)}

SCHOLARSHIP:
${JSON.stringify(scholarship, null, 2)}

Return the result using the JSON schema.
          `,
        },
      ],
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: schema,
      },
    });

    if (!response.output_text) {
      throw new Error("Gemini returned no output.");
    }

    const data = JSON.parse(response.output_text);
    return NextResponse.json(data);
  } catch (error) {
    console.log("error in eligibility:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to analyze eligibility" },
      { status: 500 }
    );
  }
}
