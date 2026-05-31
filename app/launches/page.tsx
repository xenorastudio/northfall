import LaunchesNavbar from "../components/launches/LaunchesNavbar";

/** /launches — تطبيق مستقل (Navbar خاص، بدون هيدر NorthFall) */
export default function LaunchesPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900" dir="ltr">
      <LaunchesNavbar />
    </div>
  );
}
