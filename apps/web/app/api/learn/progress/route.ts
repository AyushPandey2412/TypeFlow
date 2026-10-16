import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { User } from "../../../../../server/src/models/user.model.js";
import { HttpError } from "../../../../../server/src/lib/http-error.js";
import { beginnerLessons } from "../../../../features/learn/course";
import { mergeProgress, parseProgress } from "../../../../features/learn/progress";
import { apiError, connectDatabase, registeredUserId, requireSameOrigin } from "../../../../lib/server-backend";

const ids = new Set(beginnerLessons.map(lesson => lesson.id));
const schema = z.object({ progress: z.record(z.string().refine(id => ids.has(id)), z.object({
  accuracy: z.number().min(0).max(100),
  successes: z.number().int().min(0).max(100_000),
  attempts: z.number().int().min(0).max(100_000),
  practiceMs: z.number().min(0).max(1_000_000_000),
  recentAccuracy: z.array(z.number().min(0).max(100)).max(10),
  errorsByKey: z.record(z.string().length(1), z.number().int().min(0).max(100_000)),
  completedAt: z.string().datetime().optional(),
})) });

export async function GET(request: NextRequest) {
  try {
    const id = registeredUserId(request);
    await connectDatabase();
    const user = await User.findById(id).select("learningProgress");
    if (!user) throw new HttpError(401, "User no longer exists");
    return NextResponse.json({ progress: parseProgress(user.learningProgress, beginnerLessons) });
  } catch (error) { return apiError(error); }
}

export async function PUT(request: NextRequest) {
  try {
    requireSameOrigin(request);
    const id = registeredUserId(request);
    const input = schema.parse(await request.json());
    await connectDatabase();
    const user = await User.findById(id).select("learningProgress");
    if (!user) throw new HttpError(401, "User no longer exists");
    const progress = mergeProgress(parseProgress(input.progress, beginnerLessons), parseProgress(user.learningProgress, beginnerLessons));
    await User.updateOne({ _id: id }, { $set: { learningProgress: progress } });
    return NextResponse.json({ progress });
  } catch (error) { return apiError(error); }
}
