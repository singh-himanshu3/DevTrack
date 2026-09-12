import type { ReactNode } from "react";
import { Link } from "react-router";
import { Icon } from "./ui";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="auth-shell"><aside className="auth-story">
    <Link className="brand" to="/login"><span className="brand-mark"><Icon name="check" /></span>DevTrack<span className="brand-dot">.</span></Link>
    <div><h2>Less scattered.<br /><span>More shipped.</span></h2><p>A shared space for your team's projects, issues, and conversations. Know what matters. Move work forward.</p>
      <div className="auth-steps"><div><span>01</span>Bring your team into a workspace</div><div><span>02</span>Organize your work into projects</div><div><span>03</span>Track issues from idea to done</div></div>
    </div><small>BUILT FOR TEAMS THAT BUILD.</small>
  </aside><main className="auth-form-area">{children}</main></div>;
}
