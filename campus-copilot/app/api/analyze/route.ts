import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// this tells gemini what the json should look like
const schema = {
  type: "object",
  properties: {
    title: { type: "string" },
    session: { type: "string" },
    application_deadline: { type: "string" },
    portal: { type: "string" },
    eligibility: {
      type: "object",
      properties: {
        domicile: { type: "string" },
        income_limits: {
          type: "array",
          items: {
            type: "object",
            properties: {
              category: { type: "string" },
              limit: { type: "string" },
            },
            required: ["category", "limit"],
          },
        },
        academic_requirements: { type: "array", items: { type: "string" } },
        admission_requirements: { type: "array", items: { type: "string" } },
        attendance_requirement: { type: "string" },
      },
      required: [
        "domicile",
        "income_limits",
        "academic_requirements",
        "admission_requirements",
        "attendance_requirement",
      ],
    },
    application_rules: { type: "array", items: { type: "string" } },
    required_documents: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          requirement: { type: "string" },
          applicable_to: { type: "string" },
        },
        required: ["name", "requirement", "applicable_to"],
      },
    },
    submission_instructions: { type: "array", items: { type: "string" } },
  },
  required: [
    "title",
    "session",
    "application_deadline",
    "portal",
    "eligibility",
    "application_rules",
    "required_documents",
    "submission_instructions",
  ],
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    // check if file is there and is a pdf
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No PDF file provided" }, { status: 400 });
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
    }

    // convert pdf to base64 so we can send it to gemini
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    const response = await ai.interactions.create({
      model: "gemini-3.8-flash",
      input: [
        {
          type: "text",
          text: `Read this scholarship notice and put the useful information into the JSON format. Only use information that is actually in the PDF. If something is missing, say "Not specified in document". Focus on deadline, eligibility, income, academic rules, admission rules, documents and submission steps.`,
        },
        {
          type: "document",
          data: base64,
          mime_type: "application/pdf",
        },
      ],
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: schema,
      },
    });

    if (!response.output_text) {
      throw new Error("Gemini returned no text output");
    }

    const data = JSON.parse(response.output_text);
    return NextResponse.json(data);
  } catch (error) {
    console.log("error in analyze:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to analyze scholarship document" },
      { status: 500 }
    );
  }
}
