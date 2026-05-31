export default function AppLoading() {
  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "#151515",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <p style={{ color: "#a8aaac", fontSize: 14, fontFamily: "system-ui, sans-serif" }}>
        جاري التحميل...
      </p>
    </div>
  );
}
