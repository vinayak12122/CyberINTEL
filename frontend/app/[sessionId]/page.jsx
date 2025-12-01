import SessionUI from "../component/SessionUI";

export default async function SessionPage({ params }) {
    const {sessionId} = await params;
    return <SessionUI sessionId={sessionId} />;
}
