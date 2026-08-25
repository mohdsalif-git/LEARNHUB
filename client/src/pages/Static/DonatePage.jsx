import { useEffect } from "react";
import { Link } from "react-router-dom";

export default function DonatePage() {
  useEffect(() => { window.location.href = "/support"; }, []);
  return null;
}
