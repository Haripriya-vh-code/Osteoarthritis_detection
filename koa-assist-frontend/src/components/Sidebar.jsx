import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  History,
  FileText,
  Activity
} from "lucide-react";

function Sidebar() {
  const navigation = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Patients",
      path: "/patients",
      icon: Users,
    },
    {
      label: "Assessments",
      path: "/assessment",
      icon: ClipboardList,
    },
    {
      label: "History",
      path: "/history",
      icon: History,
    },
    {
      label: "Reports",
      path: "/reports",
      icon: FileText,
    },
  ];

  return (
    <aside className="sidebar">

      <div className="sidebar-brand">

        <div className="sidebar-logo">
          <Activity size={21} />
        </div>

        <div>
          <div className="sidebar-title">
            KOA Assist
          </div>

          <div className="sidebar-subtitle">
            Clinical AI Screening
          </div>
        </div>

      </div>

      <nav className="sidebar-navigation">

        <div className="sidebar-section-label">
          WORKSPACE
        </div>

        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-link ${
                  isActive
                    ? "sidebar-link-active"
                    : ""
                }`
              }
            >
              <Icon size={18} />

              <span>
                {item.label}
              </span>
            </NavLink>
          );
        })}

      </nav>

    </aside>
  );
}

export default Sidebar;