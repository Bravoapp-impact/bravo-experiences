export type PasswordRequirement = {
  id: "length" | "uppercase" | "lowercase" | "number" | "special";
  label: string;
  test: (pwd: string) => boolean;
};

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { id: "length", label: "Almeno 8 caratteri", test: (p) => p.length >= 8 },
  { id: "uppercase", label: "Una lettera maiuscola", test: (p) => /[A-Z]/.test(p) },
  { id: "lowercase", label: "Una lettera minuscola", test: (p) => /[a-z]/.test(p) },
  { id: "number", label: "Un numero", test: (p) => /\d/.test(p) },
  { id: "special", label: "Un carattere speciale", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export type PasswordEvaluation = {
  requirements: { id: PasswordRequirement["id"]; label: string; met: boolean }[];
  score: 0 | 1 | 2 | 3 | 4;
  label: "Molto debole" | "Debole" | "Discreta" | "Buona" | "Ottima";
  isValid: boolean;
};

export function evaluatePassword(pwd: string): PasswordEvaluation {
  const requirements = PASSWORD_REQUIREMENTS.map((r) => ({
    id: r.id,
    label: r.label,
    met: r.test(pwd),
  }));
  const metCount = requirements.filter((r) => r.met).length;
  const isValid = metCount === PASSWORD_REQUIREMENTS.length;

  let raw = metCount; // 0..5
  if (pwd.length >= 12) raw += 1;
  if (pwd.length >= 16) raw += 1;
  // Map to 0..4
  const score = (Math.max(0, Math.min(4, Math.floor(raw * 0.7))) as PasswordEvaluation["score"]);

  const labels: PasswordEvaluation["label"][] = [
    "Molto debole",
    "Debole",
    "Discreta",
    "Buona",
    "Ottima",
  ];

  return { requirements, score, label: labels[score], isValid };
}
