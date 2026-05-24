"use client"

import type { AboutTeamMember } from "@/lib/parametres"

function initials(firstName: string, lastName: string) {
  const a = firstName.trim()[0] ?? ""
  const b = lastName.trim()[0] ?? ""
  return (a + b).toUpperCase() || "JS"
}

export function EquipeSection({ team }: { team: AboutTeamMember[] }) {
  return (
    <section className="bg-zinc-50 py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl">
            L&apos;equipe
          </h2>
          <p className="mt-3 text-base text-zinc-600">
            Deux cofondateurs aux profils complementaires, ensemble pour
            chaque projet.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
          {team.map((member, i) => (
            <article
              key={`${member.firstName}-${member.lastName}-${i}`}
              className="flex flex-col items-center rounded-xl border border-zinc-100 bg-white p-8 text-center shadow-sm"
            >
              {member.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={member.avatarUrl}
                  alt={`${member.firstName} ${member.lastName}`}
                  className="h-32 w-32 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none"
                  }}
                />
              ) : (
                <div
                  aria-hidden
                  className="flex h-32 w-32 items-center justify-center rounded-full bg-zinc-200 text-3xl font-bold text-zinc-500"
                >
                  {initials(member.firstName, member.lastName)}
                </div>
              )}
              <h3 className="mt-5 text-lg font-semibold text-zinc-900">
                {member.firstName} {member.lastName}
              </h3>
              <p className="mt-1 text-sm font-medium text-[#C8151B]">
                {member.role}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                {member.bio}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
