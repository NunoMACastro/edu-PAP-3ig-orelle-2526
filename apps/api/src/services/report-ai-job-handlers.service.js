/** Handlers dos jobs longos pertencentes ao relatório e simulação. */
import { AI_JOB_TYPES } from "../models/ai-job.model.js";
import { generateConsultationReportForJob } from "./consultation-report.service.js";
import { generateMakeupPreviewForJob } from "./makeup-simulation.service.js";

/** Permite ao server compor estes handlers com análise/perguntas do core. */
export function createReportAiJobHandlers(overrides = {}) {
    return {
        [AI_JOB_TYPES.GENERATE_REPORT]: (job, context = {}) =>
            (overrides.generateReport ?? generateConsultationReportForJob)(
                job,
                { signal: context.signal },
            ),
        [AI_JOB_TYPES.GENERATE_MAKEUP_PREVIEW]: (job, context = {}) =>
            (overrides.generateMakeupPreview ?? generateMakeupPreviewForJob)(
                job,
                { signal: context.signal },
            ),
    };
}
