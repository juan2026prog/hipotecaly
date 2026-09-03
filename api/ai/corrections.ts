import { MemoryRetrievalAgent } from "../../server/ai/agents/memoryRetrievalAgent";

const memAgent = new MemoryRetrievalAgent();

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const params = req.body;
    if (params.action === "correct" || params.action === "incorrect_ai") {
      await memAgent.learnCorrection({
        memoryType: "correction_pattern",
        department: params.department || "Montevideo",
        propertyType: params.propertyType || "apartamento",
        rawCorrectionSummary: `Correccion en ${params.itemCategory}: ${params.humanCorrectionText}`,
        rawInsight: params.correctionReason,
      });
    }
    return res.status(200).json({ success: true, status: "candidate" });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || "Error processing correction" });
  }
}