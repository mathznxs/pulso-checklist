"use client"

import { useState } from "react"
import { Navbar } from "@/components/pulso/navbar"
import { AnnouncementBanner } from "@/components/pulso/announcement-banner"
import {
  Users,
  UserPlus,
  Settings,
  ShieldCheck,
  Search,
  MoreVertical,
  Calendar,
  ClipboardList,
} from "lucide-react"

interface User {
  id: string
  nome: string
  matricula: string
  cpf: string
  tipo: "assistente" | "lideranca" | "gerente" | "admin"
  setor: string
  turno: string
  status: "ativo" | "inativo"
}

const mockUsers: User[] = [
  { id: "1", nome: "Lucas Almeida", matricula: "10234", cpf: "***.***.***-12", tipo: "assistente", setor: "Futebol", turno: "Manha", status: "ativo" },
  { id: "2", nome: "Ana Costa", matricula: "10456", cpf: "***.***.***-34", tipo: "assistente", setor: "Feminino", turno: "Tarde", status: "ativo" },
  { id: "3", nome: "Pedro Santos", matricula: "10789", cpf: "***.***.***-56", tipo: "assistente", setor: "Masculino", turno: "Manha", status: "ativo" },
  { id: "4", nome: "Juliana Ferreira", matricula: "10321", cpf: "***.***.***-78", tipo: "assistente", setor: "Caixa", turno: "Intermediario", status: "ativo" },
  { id: "5", nome: "Carlos Oliveira", matricula: "10654", cpf: "***.***.***-90", tipo: "lideranca", setor: "Ilha", turno: "Manha", status: "ativo" },
  { id: "6", nome: "Mariana Lima", matricula: "10987", cpf: "***.***.***-01", tipo: "assistente", setor: "Anfitriao", turno: "Tarde", status: "inativo" },
  { id: "7", nome: "Mathias Fernand", matricula: "10001", cpf: "***.***.***-99", tipo: "gerente", setor: "-", turno: "-", status: "ativo" },
]

const tipoConfig = {
  assistente: { label: "Assistente", bgClass: "bg-blue-50 text-blue-700" },
  lideranca: { label: "Lideranca", bgClass: "bg-amber-50 text-amber-700" },
  gerente: { label: "Gerente", bgClass: "bg-emerald-50 text-emerald-700" },
  admin: { label: "Admin", bgClass: "bg-red-50 text-red-700" },
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"usuarios" | "setores" | "escalas" | "sistema">("usuarios")
  const [searchTerm, setSearchTerm] = useState("")

  const filteredUsers = mockUsers.filter(
    (u) =>
      u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.matricula.includes(searchTerm)
  )

  const tabs = [
    { key: "usuarios" as const, label: "Usuarios", icon: Users },
    { key: "setores" as const, label: "Setores", icon: ClipboardList },
    { key: "escalas" as const, label: "Escalas", icon: Calendar },
    { key: "sistema" as const, label: "Sistema", icon: Settings },
  ]

  const setores = [
    "Masculino", "Feminino", "Futebol", "Ilha", "Infantil",
    "Anfitriao", "Caixa", "OMS", "Provador",
  ]

  const turnos = [
    { nome: "Manha", horario: "09h as 17h" },
    { nome: "Intermediario", horario: "12h as 20h" },
    { nome: "Tarde", horario: "14h as 22h" },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <AnnouncementBanner message="Foco em IPC na semana" />

      <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Administracao</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Gerenciamento de usuarios, setores e configuracoes
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex items-center gap-1 overflow-x-auto border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === "usuarios" && (
            <div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar por nome ou matricula..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-72"
                  />
                </div>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <UserPlus className="h-4 w-4" />
                  Novo Usuario
                </button>
              </div>

              <div className="mt-4 overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[800px] text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Nome
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Matricula
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Tipo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Setor
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Turno
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <span className="sr-only">Acoes</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-card">
                    {filteredUsers.map((user) => {
                      const tipo = tipoConfig[user.tipo]
                      return (
                        <tr
                          key={user.id}
                          className="border-b border-border last:border-b-0 transition-colors hover:bg-muted/30"
                        >
                          <td className="px-4 py-3 font-medium text-foreground">
                            {user.nome}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                            {user.matricula}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${tipo.bgClass}`}
                            >
                              {tipo.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-foreground">{user.setor}</td>
                          <td className="px-4 py-3 text-foreground">{user.turno}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                user.status === "ativo"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  user.status === "ativo" ? "bg-emerald-500" : "bg-muted-foreground"
                                }`}
                              />
                              {user.status === "ativo" ? "Ativo" : "Inativo"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "setores" && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {setores.map((setor) => (
                <div
                  key={setor}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{setor}</p>
                      <p className="text-xs text-muted-foreground">Setor ativo</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === "escalas" && (
            <div>
              <h3 className="text-sm font-semibold text-foreground">Turnos Configurados</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {turnos.map((turno) => (
                  <div
                    key={turno.nome}
                    className="rounded-lg border border-border bg-card p-4"
                  >
                    <p className="text-sm font-semibold text-foreground">{turno.nome}</p>
                    <p className="mt-1 text-lg font-bold text-primary">{turno.horario}</p>
                  </div>
                ))}
              </div>

              <h3 className="mt-8 text-sm font-semibold text-foreground">Escala de Hoje</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                A escala fixa e planejada pela lideranca e reseta automaticamente as 00h.
                A lideranca pode criar escalas provisorias durante o dia.
              </p>
              <div className="mt-4 overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[500px] text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Funcionario</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Setor</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Turno</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo</th>
                    </tr>
                  </thead>
                  <tbody className="bg-card">
                    {mockUsers.filter((u) => u.tipo === "assistente" && u.status === "ativo").map((u) => (
                      <tr key={u.id} className="border-b border-border last:border-b-0">
                        <td className="px-4 py-3 font-medium text-foreground">{u.nome}</td>
                        <td className="px-4 py-3 text-foreground">{u.setor}</td>
                        <td className="px-4 py-3 text-foreground">{u.turno}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                            Fixa
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "sistema" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-card p-5">
                <h4 className="text-sm font-semibold text-foreground">Informacoes do Sistema</h4>
                <div className="mt-4 flex flex-col gap-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Versao</span>
                    <span className="font-medium text-foreground">3.0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Ambiente</span>
                    <span className="font-medium text-foreground">Producao</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Banco</span>
                    <span className="font-medium text-foreground">PostgreSQL (Supabase)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Frontend</span>
                    <span className="font-medium text-foreground">Next.js 16</span>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-card p-5">
                <h4 className="text-sm font-semibold text-foreground">Configuracoes de Login</h4>
                <div className="mt-4 flex flex-col gap-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Login via</span>
                    <span className="font-medium text-foreground">Matricula</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Senha</span>
                    <span className="font-medium text-foreground">CPF</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Autenticacao</span>
                    <span className="font-medium text-foreground">Supabase Auth</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Prazo max. tarefa</span>
                    <span className="font-medium text-foreground">2 dias</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
