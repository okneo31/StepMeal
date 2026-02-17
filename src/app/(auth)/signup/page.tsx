"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", nickname: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "회원가입에 실패했습니다.");
        return;
      }

      // Auto login after signup
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        router.push("/login");
      } else {
        router.push("/home");
        router.refresh();
      }
    } catch {
      setError("회원가입 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-[var(--color-primary)]/15 border-2 border-[var(--color-primary)]/30 flex items-center justify-center mx-auto mb-4">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="10" r="4" fill="#22C55E" fillOpacity="0.6"/>
            <path d="M18 15V24L14 32M18 24L22 32" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M12 19L18 17L24 19" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gradient-green">StepMeal</h1>
        <p className="mt-2 text-[var(--color-text-muted)] text-sm">새 계정 만들기</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="닉네임"
          placeholder="닉네임 입력"
          value={form.nickname}
          onChange={update("nickname")}
          required
          minLength={2}
          maxLength={20}
        />
        <Input
          label="이메일"
          type="email"
          placeholder="email@example.com"
          value={form.email}
          onChange={update("email")}
          required
        />
        <Input
          label="비밀번호"
          type="password"
          placeholder="6자 이상"
          value={form.password}
          onChange={update("password")}
          required
          minLength={6}
        />
        {error && <p className="text-sm text-red-400 text-center">{error}</p>}
        <Button type="submit" fullWidth loading={loading}>
          회원가입
        </Button>
      </form>

      <p className="text-center text-sm text-[var(--color-text-muted)]">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="text-[var(--color-primary)] font-semibold">
          로그인
        </Link>
      </p>
    </div>
  );
}
