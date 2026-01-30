"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MonthSelector } from "@/components/dashboard/month-selector";
import { BoostDeclarationModal } from "@/components/boost/boost-declaration-modal";
import { Zap, Star, TrendingUp } from "lucide-react";
import { useAuth } from "@/lib/firebase/use-auth";
import { getBoostsByUserAndMonth, getBoostsByMonth, getUsersMap } from "@/lib/firebase/boosts";
import type { Boost, BoostWithUser } from "@/types/boost";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";

export default function BoostPage() {
  const { user, userData } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<string>(
    format(new Date(), "yyyy-MM")
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [myBoosts, setMyBoosts] = useState<Boost[]>([]);
  const [allBoosts, setAllBoosts] = useState<BoostWithUser[]>([]);
  const [leaderboard, setLeaderboard] = useState<
    { userId: string; userName: string; count: number; remuneration: number }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const [userBoosts, monthBoosts] = await Promise.all([
        getBoostsByUserAndMonth(user.uid, selectedMonth),
        getBoostsByMonth(selectedMonth),
      ]);

      setMyBoosts(userBoosts);

      const userIds = [...new Set(monthBoosts.map((b) => b.userId))];
      const usersMap = await getUsersMap(userIds);

      const enriched = monthBoosts.map((b) => {
        const u = usersMap[b.userId];
        return {
          ...b,
          userEmail: u?.email,
          userFirstName: u?.firstName,
          userLastName: u?.lastName,
        } as BoostWithUser;
      });

      setAllBoosts(enriched);

      const byUser = new Map<
        string,
        { userName: string; count: number; remuneration: number }
      >();

      enriched.forEach((b) => {
        const name =
          b.userFirstName || b.userLastName
            ? [b.userFirstName, b.userLastName].filter(Boolean).join(" ")
            : b.userEmail?.split("@")[0] ?? "Inconnu";

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
      console.error("Erreur chargement boosts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Boost</h1>
          <p className="text-muted-foreground">
            Déclarez vos avis clients et consultez le classement
          </p>
        </div>
        <MonthSelector
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
        />
      </div>

      {/* Section 1 : Ma déclaration et mes boosts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Ma déclaration et mes boosts du mois
          </CardTitle>
          <CardDescription>
            Déclarez un nouveau boost et consultez vos déclarations du mois
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button
            size="lg"
            onClick={() => setModalOpen(true)}
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
          >
            <Zap className="h-5 w-5 mr-2" />
            Déclarer un boost
          </Button>

          <BoostDeclarationModal
            open={modalOpen}
            onOpenChange={setModalOpen}
            onSuccess={loadData}
          />

          <div>
            <h3 className="font-semibold mb-3">Mes boosts du mois</h3>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
              </div>
            ) : myBoosts.length === 0 ? (
              <p className="text-muted-foreground py-4">
                Aucun boost déclaré ce mois-ci
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-center">Étoiles</TableHead>
                    <TableHead className="text-right">Rémunération</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myBoosts.map((boost) => (
                    <TableRow key={boost.id}>
                      <TableCell>
                        {format(
                          boost.date instanceof Date
                            ? boost.date
                            : (boost.date as { toDate: () => Date }).toDate(),
                          "dd/MM/yyyy",
                          { locale: fr }
                        )}
                      </TableCell>
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
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 2 : Classement par type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            Classement Boost du mois
          </CardTitle>
          <CardDescription>
            Classement de tous les collaborateurs par nombre de boosts déclarés
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
            </div>
          ) : leaderboard.length === 0 ? (
            <p className="text-muted-foreground py-4">
              Aucun boost déclaré ce mois-ci
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Collaborateur</TableHead>
                  <TableHead className="text-center">Nb boosts</TableHead>
                  <TableHead className="text-right">Rémunération totale</TableHead>
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
                    <TableCell className="text-center">{entry.count}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(entry.remuneration)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
