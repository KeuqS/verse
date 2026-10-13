import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Download, Clipboard, RotateCcw } from "lucide-react";
import { VerseMark } from "@/components/VerseMark";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  isPilotAllocation, pilotAssignment, pilotExportJson, PILOT_STIMULI,
} from "@/lib/pilotStudy";
import type { PilotResponse } from "@/lib/pilotStudy";

type Scale = 1 | 2 | 3 | 4 | 5;
const scaleOptions = [1, 2, 3, 4, 5] as const;

function ScaleQuestion({
  id, label, value, onChange, minimum, maximum,
}: {
  id: string;
  label: string;
  value: Scale | null;
  onChange: (value: Scale) => void;
  minimum: string;
  maximum: string;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-3">
        {scaleOptions.map(score => (
          <label key={score} className="inline-flex items-center gap-1 text-sm">
            <input type="radio" name={id} value={score}
              checked={value === score} onChange={() => onChange(score)} required />
            {score}
          </label>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{minimum} (1) to {maximum} (5)</p>
    </fieldset>
  );
}

/**
 * Optional, in-memory, text-free usability instrument.
 * Participants work in a separate writing-room tab and return to record
 * categorical answers. This page never captures poem drafts or sends results.
 */
export default function Study() {
  const [codeText, setCodeText] = useState("");
  const [allocation, setAllocation] = useState<number | null>(null);
  const [responses, setResponses] = useState<PilotResponse[]>([]);
  const [completed, setCompleted] = useState(false);
  const [usefulness, setUsefulness] = useState<Scale | null>(null);
  const [friction, setFriction] = useState<Scale | null>(null);
  const [taskCompleted, setTaskCompleted] = useState<boolean | null>(null);
  const [adherence, setAdherence] = useState<boolean | null>(null);
  const [notice, setNotice] = useState("");

  const allocationNumber = Number(codeText);
  const validCode = codeText.trim() !== "" && isPilotAllocation(allocationNumber);
  const assignment = allocation === null ? [] : pilotAssignment(allocation);
  const trial = assignment[responses.length];
  const stimulus = trial && PILOT_STIMULI.find(item => item.id === trial.stimulusId);

  function begin() {
    if (!validCode || allocation !== null) return;
    setAllocation(allocationNumber);
    setNotice("");
  }

  function submitTrial(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trial || usefulness === null || friction === null ||
        taskCompleted === null || adherence === null) return;
    const next = [...responses, {
      position: trial.position,
      completed: taskCompleted,
      usefulness,
      friction,
      followedInstructions: adherence,
    }];
    setResponses(next);
    setUsefulness(null);
    setFriction(null);
    setTaskCompleted(null);
    setAdherence(null);
    setNotice("");
    if (next.length === 3) setCompleted(true);
  }

  async function copyPrompt() {
    if (!stimulus) return;
    try {
      await navigator.clipboard.writeText(stimulus.lines);
      setNotice("Exercise text copied. Paste it into the writing room.");
    } catch {
      setNotice("Clipboard unavailable. Select and copy the sample lines from this page manually.");
    }
  }

  function downloadResponses() {
    if (allocation === null || !completed) return;
    try {
      const payload = pilotExportJson(allocation, responses);
      const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "verse-pilot-response-v1.json";
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setNotice("Local response file prepared. Nothing was submitted to Verse.");
    } catch {
      setNotice("Export failed. Your responses are still present on this page.");
    }
  }

  function clearSession() {
    setCodeText("");
    setAllocation(null);
    setResponses([]);
    setCompleted(false);
    setUsefulness(null);
    setFriction(null);
    setTaskCompleted(null);
    setAdherence(null);
    setNotice("Study responses cleared from this page.");
  }

  return (
    <div className="min-h-screen bg-background font-literary">
      <header className="border-b bg-background/95">
        <div className="mx-auto max-w-3xl px-5 py-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <VerseMark />
            <div>
              <h1 className="text-xl font-bold">Verse</h1>
              <p className="text-xs text-muted-foreground">Voluntary writing study</p>
            </div>
          </div>
          <Link className="text-sm underline underline-offset-4" to="/">Return to Verse</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-9 space-y-6">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-widest text-literary-sage">Research instrument · Pilot v1</p>
          <h2 className="text-3xl font-semibold">A small study of writing tools</h2>
          <p className="text-muted-foreground leading-relaxed">
            Three brief writing tasks compare unaided revision, curated examples and
            selected-text craft experiments. Each task uses a different sample poem.
            There is no claim that any approach improves literary quality.
          </p>
        </div>
        <Card className="border-literary-sage/25">
          <CardHeader><CardTitle className="text-lg">Your participation and privacy</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>Participation is voluntary. This page stores responses only in memory during
              this visit. It has no server submission, analytics collection or account login.
              Refreshing or closing this tab loses unfinished responses.</p>
            <p>No draft text, name, email address or free-form comments are collected.
              If you download a record, it contains only an assignment code, three
              condition and task identifiers, and your categorical answers.
              Someone who knows your assignment code could still connect it to you.</p>
            <p>Use a separate writing-room tab for each exercise. Do not save these
              sample poems to your normal collection. If you choose to share the
              downloaded file with a researcher, that sharing is a separate decision.</p>
          </CardContent>
        </Card>

        {allocation === null ? (
          <Card>
            <CardHeader><CardTitle className="text-lg">Start an optional session</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter an allocation code from 0 to 35 supplied by the study organizer.
                A valid code fixes the order of conditions and prompts.
              </p>
              <div className="space-y-2">
                <label htmlFor="pilot-code" className="block text-sm font-medium">Allocation code</label>
                <input id="pilot-code" type="number" min="0" max="35" step="1"
                  className="block w-32 rounded-md border bg-background px-3 py-2 text-sm"
                  value={codeText} onChange={event => setCodeText(event.target.value)} />
              </div>
              <Button disabled={!validCode} onClick={begin}>I choose to participate</Button>
              <p className="text-xs text-muted-foreground">
                Researchers must distribute codes in balanced blocks and obtain any necessary
                study consent or ethics approval independently of this tool.
              </p>
            </CardContent>
          </Card>
        ) : completed ? (
          <Card>
            <CardHeader><CardTitle className="text-lg">Session complete</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Your three responses are ready to export. The JSON includes no poem text.
                Download is the only export action; Verse does not receive the file.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button onClick={downloadResponses}><Download className="h-4 w-4 mr-2" /> Download responses</Button>
                <Button variant="outline" onClick={clearSession}><RotateCcw className="h-4 w-4 mr-2" /> Clear this session</Button>
              </div>
            </CardContent>
          </Card>
        ) : trial && stimulus ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Task {trial.position} of 3</CardTitle>
              <p className="text-sm text-muted-foreground">Allocation {allocation} · {stimulus.label}</p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <h3 className="font-medium">Your assigned approach</h3>
                {trial.condition === "unaided" && (
                  <p className="text-sm text-muted-foreground">
                    Revise the sample by typing in the writing room. Do not use Literary
                    examples or Craft experiments for this task.
                  </p>
                )}
                {trial.condition === "examples" && (
                  <p className="text-sm text-muted-foreground">
                    Choose {stimulus.exampleSelection} under Literary Influence.
                    Explore Literary examples, then revise as you wish. Do not use Craft experiments.
                  </p>
                )}
                {trial.condition === "experiments" && (
                  <p className="text-sm text-muted-foreground">
                    Select a phrase and use Craft experiments to preview Echo, Isolate or Omit.
                    You decide whether to apply it. Do not use Literary examples.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Sample text to revise</h3>
                <pre className="whitespace-pre-wrap font-literary text-base bg-background rounded-md border p-4">{stimulus.lines}</pre>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => void copyPrompt()}><Clipboard className="h-4 w-4 mr-2" /> Copy sample text</Button>
                  <Button asChild variant="outline"><Link to="/write" target="_blank" rel="noopener noreferrer"><BookOpen className="h-4 w-4 mr-2" /> Open writing room</Link></Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Work for roughly five minutes. Return to this tab and describe the experience.
                Do not save the sample poem in your personal collection.
              </p>
              <form className="space-y-5 border-t pt-4" onSubmit={submitTrial}>
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">Did you complete a revision?</legend>
                  <div className="flex gap-5 text-sm">
                    <label className="flex items-center gap-2"><input type="radio" name="completed" checked={taskCompleted === true} onChange={() => setTaskCompleted(true)} required /> Yes</label>
                    <label className="flex items-center gap-2"><input type="radio" name="completed" checked={taskCompleted === false} onChange={() => setTaskCompleted(false)} required /> No</label>
                  </div>
                </fieldset>
                <ScaleQuestion id="usefulness" label="How useful was the assigned approach for this task?"
                  value={usefulness} onChange={setUsefulness} minimum="Not useful" maximum="Very useful" />
                <ScaleQuestion id="friction" label="How much difficulty did you encounter using the assigned approach?"
                  value={friction} onChange={setFriction} minimum="None" maximum="A great deal" />
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">Did you follow the assigned tool instructions?</legend>
                  <div className="flex gap-5 text-sm">
                    <label className="flex items-center gap-2"><input type="radio" name="adherence" checked={adherence === true} onChange={() => setAdherence(true)} required /> Yes</label>
                    <label className="flex items-center gap-2"><input type="radio" name="adherence" checked={adherence === false} onChange={() => setAdherence(false)} required /> No</label>
                  </div>
                </fieldset>
                <Button type="submit" disabled={taskCompleted === null || usefulness === null || friction === null || adherence === null}>
                  Record response and {trial.position === 3 ? "finish" : "continue"}
                </Button>
              </form>
              <Button size="sm" variant="ghost" onClick={clearSession}>Withdraw and clear session</Button>
            </CardContent>
          </Card>
        ) : null}
        <p role="status" aria-live="polite" className="text-sm text-muted-foreground">{notice}</p>
      </main>
    </div>
  );
}
