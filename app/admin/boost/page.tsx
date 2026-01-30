"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MonthSelector } from "@/components/dashboard/month-selector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Zap, Star, TrendingUp } from "lucide-react";
import {
  getAllBoostsForAdmin,
  getUsersMap,
  getBoostsByMonth,
} from "@/lib/firebase/boosts";
import type { Boost, BoostWithUser, BoostType } from "@/types/boost";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { UserData } from "@/lib/firebase/auth";

const BOOST_TYPES: { value: BoostType; label: string }[] = [
  { value: "GOOGLE", label: "Google" },
];

export default function AdminBoostPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>(
    format(new Date(), "yyyy-MM")
  );
  const [selectedUserId, setSelectedUserId] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<BoostType | "all">("all");
  const [boosts, setBoosts] = useState<BoostWithUser[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [leaderboard, setLeaderboard] = useState<
    { userId: string; userName: string; count: number; remuneration: number }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    if (!db) return;
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("active", "==", true));
    const snapshot = await getDocs(q);
    const usersData = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() ?? new Date(),
    })) as UserData[];
    setUsers(usersData);
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const rawBoosts = await getAllBoostsForAdmin(
        selectedMonth,
        selectedUserId === "all" ? undefined : selectedUserId,
        selectedType === "all" ? undefined : selectedType
      );

      const userIds = [...new Set(rawBoosts.map((b) => b.userId))];
      const usersMap = await getUsersMap(userIds);

      const enriched = rawBoosts.map((b) => {
        const u = usersMap[b.userId];
        return {
          ...b,
          userEmail: u?.email,
          userFirstName: u?.firstName,
          userLastName: u?.lastName,
        } as BoostWithUser;
      });

      setBoosts(enriched);

      const allMonthBoosts = await getBoostsByMonth(selectedMonth);
      const allUserIds = [...new Set(allMonthBoosts.map((b) => b.userId))];
      const allUsersMap = await getUsersMap(allUserIds);

      const byUser = new Map<
        string,
        { userName: string; count: number; remuneration: number }
      >();

      allMonthBoosts.forEach((b) => {
        const u = allUsersMap[b.userId];
        const name =
          u?.firstName || u?.lastName
            ? [u.firstName, u.lastName].filter(Boolean).join(" ")
            : u?.email?.split("@")[0] ?? "Inconnu";

        if (!byUser.has(b.userId)) {
          byUser.set(b.userId, { userName: name, count: 0, remuneration: 0 });
        }
        const entry = byUser.get(b.userId)!;
        entry.count += 1;
        entry.remuneration += b.remuneration;
      });

      setLeaderboard(
        Array.from(byUser.entries())
          .map(([userId, data]) => ({ userId, ...data }))
          .sort((a, b) => b.count - a.count)
      );
    } catch (error) {
      console.error("Erreur chargement boosts admin:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedUserId, selectedType]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getUserName = (b: BoostWithUser) =>
    b.userFirstName || b.userLastName
      ? [b.userFirstName, b.userLastName].filter(Boolean).join(" ")
      : b.userEmail?.split("@")[0] ?? "Inconnu";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Zap className="h-7 w-7 text-amber-500" />
          Boost — Administration
        </h1>
        <p className="text-muted-foreground">
          Liste exhaustive des boosts et classement des collaborateurs
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between flex-wrap">
            <div>
              <CardTitle>Filtres</CardTitle>
              <CardDescription>Affiner la liste des boosts</CardDescription>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <MonthSelector
                selectedMonth={selectedMonth}
                onMonthChange={setSelectedMonth}
              />
              <Select
                value={selectedUserId}
                onValueChange={setSelectedUserId}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Tous les collaborateurs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les collaborateurs</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedType}
                onValueChange={(v) => setSelectedType(v as BoostType | "all")}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous types</SelectItem>
                  {BOOST_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Liste des boosts</CardTitle>
            <CardDescription>
              {boosts.length} boost(s) pour le mois sélectionné
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
              </div>
            ) : boosts.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">
                Aucun boost trouvé
              </p>
            ) : (
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Collaborateur</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead className="text-center">Étoiles</TableHead>
                      <TableHead className="text-right">Rémunération</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {boosts.map((boost) => (
                      <TableRow key={boost.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(
                            boost.date instanceof Date
                              ? boost.date
                              : (boost.date as { toDate: () => Date }).toDate(),
                            "dd/MM/yyyy",
                            { locale: fr }
                          )}
                        </TableCell>
                        <TableCell>{getUserName(boost)}</TableCell>
                        <TableCell>{boost.type}</TableCell>
                        <TableCell>{boost.clientName}</TableCell>
                        <TableCell className="text-center">
                          <span className="flex items-center justify-center gap-0.5">
                            {boost.stars}{" "}
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(boost.remuneration)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Classement du mois
            </CardTitle>
            <CardDescription>
              Totaux par collaborateur
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
              </div>
            ) : leaderboard.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">
                Aucune donnée
              </p>
            ) : (
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Collaborateur</TableHead>
                      <TableHead className="text-center">Nb boosts</TableHead>
                      <TableHead className="text-right">Rémunération</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard.map((entry, index) => (
                      <TableRow key={entry.userId}>
                        <TableCell className="font-medium">
                          {index === 0 ? (
                            <span className="text-amber-500">1</span>
                          ) : (
                            index + 1
                          )}
                        </TableCell>
                        <TableCell>{entry.userName}</TableCell>
                        <TableCell className="text-center">
                          {entry.count}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(entry.remuneration)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
