"use client";

import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [scholarship, setScholarship] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [student, setStudent] = useState({
    course: "B.Tech",
    year: "1st Year",
    category: "General",
    admission: "UPTAC / AKTU Counselling",
    percentage: "",
    income: "",
    hostel: "Off-campus hosteller",
    previous: "No",
  });

  const [answer, setAnswer] = useState<any>(null); // result from gemin
  const [checking, setChecking] = useState(false);


  async function analyzeFile() {
    if (!file) {
      setMessage("Please select a PDF first.");
      return;
    }

    setLoading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setScholarship(data);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    }

    setLoading(false);
  }

  // sends student detals + scholaship info to gemni
  async function checkEligibility() {
    if (!scholarship) return;

    setChecking(true);
    setAnswer(null);

    try {
      const res = await fetch("/api/check-eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scholarship, student }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Could not check eligibility");
      }

      setAnswer(data);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    }

    setChecking(false);
  }

  function updateStudent(name: string, value: string) {
    setStudent({ ...student, [name]: value }); 
  }

  function startAgain() {
    setFile(null);
    setScholarship(null);
    setAnswer(null);
    setMessage("");
  }

  function getIcon(status: string) {
    if (status === "meets_requirement") return "✓";
    if (status === "does_not_meet") return "✕";
    return "?";
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <p className="text-sm text-blue-400">GEMINI PROJECT</p>
          <h1 className="mt-2 text-4xl font-bold">Campus Copilot</h1>
          <p className="mt-2 max-w-2xl text-slate-400">
            A simple assistant that helps students understand college notices
            and scholarship requirements.
          </p>
        </header>

        {!scholarship ? (
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-7">
            <h2 className="text-xl font-semibold">Upload a college notice</h2>
            <p className="mt-2 text-sm text-slate-400">
              Upload a scholarship PDF and Gemini will extract the important
              information from it.
            </p>

            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="mt-6 block w-full text-sm text-slate-400"
            />

            <button
              onClick={analyzeFile}
              disabled={loading}
              className="mt-5 rounded-lg bg-blue-600 px-5 py-3 hover:bg-blue-500 disabled:opacity-50"
            >
              {loading ? "Reading PDF..." : "Analyze PDF"}
            </button>

            {message && <p className="mt-4 text-sm text-red-400">{message}</p>}
          </section>
        ) : (
          <div className="space-y-5">
            <section className="rounded-xl border border-slate-800 bg-slate-900 p-7">
              <div className="flex flex-col gap-5 md:flex-row md:justify-between">
                <div>
                  <p className="text-sm text-blue-400">SCHOLARSHIP</p>
                  <h2 className="mt-2 text-2xl font-bold">{scholarship.title}</h2>
                  <p className="mt-2 text-slate-400">
                    Session: {scholarship.session}
                  </p>
                </div>

                <div className="rounded-lg border border-red-900 bg-red-950/30 p-4">
                  <p className="text-xs text-red-400">DEADLINE</p>
                  <p className="mt-1 font-semibold">
                    {scholarship.application_deadline}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-lg bg-slate-800 p-4">
                <p className="text-xs text-slate-400">Official portal</p>
                <a
                  href={scholarship.portal}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400"
                >
                  {scholarship.portal}
                </a>
              </div>
            </section>

            <section className="rounded-xl border border-slate-800 bg-slate-900 p-7">
              <h2 className="text-xl font-semibold">Eligibility information</h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-lg bg-slate-800 p-4">
                  <p className="text-sm text-slate-400">Domicile</p>
                  <p className="mt-2 text-sm">{scholarship.eligibility.domicile}</p>
                </div>

                <div className="rounded-lg bg-slate-800 p-4">
                  <p className="text-sm text-slate-400">Attendance</p>
                  <p className="mt-2 text-sm">
                    {scholarship.eligibility.attendance_requirement}
                  </p>
                </div>
              </div>

              <h3 className="mt-6 font-semibold">Income limits</h3>
              <div className="mt-3 space-y-2">
                {scholarship.eligibility.income_limits.map((item: any, i: number) => (
                  <div key={i} className="rounded-lg bg-slate-800 p-4 text-sm">
                    <b>{item.category}</b>
                    <p className="mt-1 text-slate-400">{item.limit}</p>
                  </div>
                ))}
              </div>

              <h3 className="mt-6 font-semibold">Academic requirements</h3>
              <ul className="mt-3 space-y-2">
                {scholarship.eligibility.academic_requirements.map((item: any, i: number) => (
                  <li key={i} className="rounded-lg bg-slate-800 p-3 text-sm">
                    ✓ {item}
                  </li>
                ))}
              </ul>
            </section>

            <section
              id="eligibility"
              className="rounded-xl border border-blue-900 bg-slate-900 p-7"
            >
              <p className="text-sm text-blue-400">PERSONAL CHECK</p>
              <h2 className="mt-2 text-2xl font-bold">Check My Eligibility</h2>
              <p className="mt-2 text-sm text-slate-400">
                Enter some basic details and Gemini will compare them with the
                notice.
              </p>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <Field label="Course">
                  <select
                    value={student.course}
                    onChange={(e) => updateStudent("course", e.target.value)}
                    className="input"
                  >
                    <option>B.Tech</option>
                    <option>B.Pharm</option>
                    <option>MCA</option>
                    <option>MBA</option>
                  </select>
                </Field>

                <Field label="Year">
                  <select
                    value={student.year}
                    onChange={(e) => updateStudent("year", e.target.value)}
                    className="input"
                  >
                    <option>1st Year</option>
                    <option>2nd Year</option>
                    <option>3rd Year</option>
                    <option>4th Year</option>
                  </select>
                </Field>

                <Field label="Category">
                  <select
                    value={student.category}
                    onChange={(e) => updateStudent("category", e.target.value)}
                    className="input"
                  >
                    <option>General</option>
                    <option>OBC</option>
                    <option>SC</option>
                    <option>ST</option>
                    <option>Minority</option>
                  </select>
                </Field>

                <Field label="Admission through">
                  <select
                    value={student.admission}
                    onChange={(e) => updateStudent("admission", e.target.value)}
                    className="input"
                  >
                    <option>UPTAC / AKTU Counselling</option>
                    <option>Management Quota</option>
                    <option>Vacant Seat</option>
                    <option>Fee Waiver</option>
                  </select>
                </Field>

                <Field label="Class 12 percentage">
                  <input
                    type="number"
                    value={student.percentage}
                    onChange={(e) => updateStudent("percentage", e.target.value)}
                    placeholder="Example: 82.6"
                    className="input"
                  />
                </Field>

                <Field label="Annual family income">
                  <input
                    type="number"
                    value={student.income}
                    onChange={(e) => updateStudent("income", e.target.value)}
                    placeholder="Example: 180000"
                    className="input"
                  />
                </Field>

                <Field label="Hostel">
                  <select
                    value={student.hostel}
                    onChange={(e) => updateStudent("hostel", e.target.value)}
                    className="input"
                  >
                    <option>On-campus hosteller</option>
                    <option>Day scholar</option>
                    <option>Off-campus hosteller</option>
                  </select>
                </Field>

                <Field label="Applied last year?">
                  <select
                    value={student.previous}
                    onChange={(e) => updateStudent("previous", e.target.value)}
                    className="input"
                  >
                    <option>No</option>
                    <option>Yes</option>
                  </select>
                </Field>
              </div>

              <button
                onClick={checkEligibility}
                disabled={checking}
                className="mt-6 rounded-lg bg-blue-600 px-5 py-3 hover:bg-blue-500 disabled:opacity-50"
              >
                {checking ? "Checking..." : "Check Eligibility"}
              </button>
            </section>

            {answer && (
              <section className="rounded-xl border border-slate-800 bg-slate-900 p-7">
                <p className="text-sm text-blue-400">GEMINI RESULT</p>
                <h2 className="mt-2 text-2xl font-bold">
                  Your scholarship assessment
                </h2>

                <div className="mt-5 rounded-lg bg-slate-800 p-4">
                  <p className="font-semibold">
                    {String(answer.overall_status).replaceAll("_", " ")}
                  </p>
                  <p className="mt-2 text-sm text-slate-300">
                    {answer.summary}
                  </p>
                </div>

                <h3 className="mt-6 font-semibold">Requirement checks</h3>
                <div className="mt-3 space-y-2">
                  {answer.checks?.map((item: any, i: number) => (
                    <div key={i} className="rounded-lg bg-slate-800 p-4">
                      <div className="flex justify-between gap-4">
                        <b>{item.requirement}</b>
                        <span>
                          {getIcon(item.status)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-400">
                        {item.explanation}
                      </p>
                    </div>
                  ))}
                </div>

                <h3 className="mt-6 font-semibold">Documents</h3>
                <div className="mt-3 space-y-2">
                  {answer.documents?.map((item: any, i: number) => (
                    <div key={i} className="rounded-lg bg-slate-800 p-4">
                      <b>{item.name}</b>
                      <p className="mt-1 text-sm text-blue-400">
                        {item.status}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        {item.reason}
                      </p>
                    </div>
                  ))}
                </div>

                <h3 className="mt-6 font-semibold">What to do next</h3>
                <ul className="mt-3 space-y-2">
                  {answer.important_actions?.map((item: string, i: number) => (
                    <li key={i} className="rounded-lg bg-slate-800 p-3 text-sm">
                      → {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="rounded-xl border border-slate-800 bg-slate-900 p-7">
              <h2 className="text-xl font-semibold">Required documents</h2>
              <div className="mt-4 space-y-2">
                {scholarship.required_documents.map((item: any, i: number) => (
                  <div key={i} className="rounded-lg bg-slate-800 p-4">
                    <b>□ {item.name}</b>
                    <p className="mt-1 text-sm text-slate-400">
                      {item.requirement}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-slate-800 bg-slate-900 p-7">
              <h2 className="text-xl font-semibold">Important rules</h2>
              <div className="mt-4 space-y-2">
                {scholarship.application_rules.map((item: any, i: number) => (
                  <p key={i} className="rounded-lg bg-slate-800 p-4 text-sm">
                    {item}
                  </p>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-slate-800 bg-slate-900 p-7">
              <h2 className="text-xl font-semibold">What you need to do</h2>
              <ol className="mt-4 space-y-3">
                {scholarship.submission_instructions.map((item: any, i: number) => (
                  <li key={i} className="text-sm text-slate-300">
                    <b>{i + 1}.</b> {item}
                  </li>
                ))}
              </ol>
            </section>

            <button
              onClick={startAgain}
              className="rounded-lg border border-slate-700 px-5 py-3 text-sm hover:bg-slate-900"
            >
              Start again
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

function Field(props: any) {
  return (
    <div>
      <label className="text-sm text-slate-300">{props.label}</label>
      <div className="mt-2">{props.children}</div>
    </div>
  );
}
