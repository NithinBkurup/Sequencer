export function getParams() {
  const p = new URLSearchParams(window.location.search);

  return {
    plant: p.get("plant"),
    line: p.get("line"),
    from: p.get("from"),
    to: p.get("to"),
    material: p.get("material") || "ALL",
    username: p.get("username") || p.get("user"),
    clientid: p.get("clientid") || p.get("client")
  };
}