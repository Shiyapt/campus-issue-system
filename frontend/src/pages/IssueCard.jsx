import { fileUrl } from '../api';

export default function IssueCard({ i, children }) {
  return (
    <div className="card">
      <div className="row between">
        <h3>{i.title} <small>({i.token_id})</small></h3>
        <span className={`badge ${i.status}`}>{i.status}</span>
      </div>
      <p><b>{i.reporter_type}</b>: {i.reporter_name} ({i.reporter_id}) &middot; {i.category}</p>
      <p>{i.description}</p>
      <p>AI bot score: <b>{i.ai_score}</b> - {i.ai_remark}</p>
      <div className="media">
        {i.selfie_path && <img src={fileUrl(i.selfie_path)} alt="selfie" />}
        {i.photo_path && <img src={fileUrl(i.photo_path)} alt="photo" />}
        {i.video_path && <video controls src={fileUrl(i.video_path)} />}
        {i.voice_path && <audio controls src={fileUrl(i.voice_path)} />}
      </div>
      {i.assigned_to && <p>Assigned to: <b>{i.assigned_to}</b></p>}
      {i.resolved_by_name && <p>Resolved by: <b>{i.resolved_by_name}</b></p>}
      <div className="row">{children}</div>
    </div>
  );
}
