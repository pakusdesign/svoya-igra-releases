import { QuestionPageClient } from "./QuestionPageClient";

export default async function QuestionPage({ params }: { params: Promise<{ questionId: string }> }) {
  const { questionId } = await params;
  return <QuestionPageClient questionId={questionId} />;
}
