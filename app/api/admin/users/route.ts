import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth, FieldValue } from "@/lib/firebase/admin-config";
import { verifyAdmin } from "@/lib/utils/auth-utils";

// Rôles valides pour l'accès au dashboard (alignés avec lib/utils/roles et RouteGuard)
const VALID_ROLES = [
  "ADMINISTRATEUR",
  "CDC_COMMERCIAL",
  "COMMERCIAL_SANTE_INDIVIDUEL",
  "COMMERCIAL_SANTE_COLLECTIVE",
  "GESTIONNAIRE_SINISTRE",
] as const;

// GET - Liste tous les utilisateurs (admin uniquement)
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const listUsersResult = await adminAuth.listUsers();
    const usersSnapshot = await adminDb.collection("users").get();

    const usersData = new Map<string, Record<string, unknown>>();
    usersSnapshot.forEach((doc) => {
      usersData.set(doc.id, doc.data() as Record<string, unknown>);
    });

    const usersWithData = listUsersResult.users.map((user) => {
      const userData = usersData.get(user.uid) ?? {};
      return {
        uid: user.uid,
        email: user.email,
        role: userData.role ?? "CDC_COMMERCIAL",
        active: userData.active !== false,
        createdAt: user.metadata.creationTime,
        emailVerified: user.emailVerified,
        firstName: userData.firstName ?? undefined,
        lastName: userData.lastName ?? undefined,
        phone: userData.phone ?? undefined,
        contrat: userData.contrat ?? undefined,
        etp: userData.etp ?? undefined,
      };
    });

    return NextResponse.json({ users: usersWithData });
  } catch (error: unknown) {
    console.error("Erreur GET users:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur lors de la récupération des utilisateurs" },
      { status: 500 }
    );
  }
}

// POST - Créer un nouvel utilisateur (admin uniquement)
export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { email, password, role } = body;

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: "Email, password et role requis" },
        { status: 400 }
      );
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: `Rôle invalide. Rôles acceptés : ${VALID_ROLES.join(", ")}` },
        { status: 400 }
      );
    }

    const ALLOWED_DOMAINS = ["@allianz-nogaro.fr"];
    const isValidDomain = ALLOWED_DOMAINS.some((domain) => email.endsWith(domain));
    if (!isValidDomain) {
      return NextResponse.json(
        { error: `Email doit se terminer par ${ALLOWED_DOMAINS.join(" ou ")}` },
        { status: 400 }
      );
    }

    const userRecord = await adminAuth.createUser({
      email,
      password,
      emailVerified: false,
    });

    await adminDb.collection("users").doc(userRecord.uid).set({
      id: userRecord.uid,
      email,
      role,
      active: true,
      createdAt: FieldValue.serverTimestamp(),
    });

    try {
      await adminDb.collection("logs").add({
        level: "success",
        action: "user_created",
        userId: auth.userId,
        userEmail: auth.userEmail,
        description: `Création d'un utilisateur ${email} avec le rôle ${role}`,
        metadata: { newUserEmail: email, role },
        timestamp: FieldValue.serverTimestamp(),
      });
    } catch (logError) {
      console.error("Erreur lors de l'enregistrement du log:", logError);
    }

    return NextResponse.json({
      success: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        role,
      },
    });
  } catch (error: unknown) {
    console.error("Erreur POST user:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour un utilisateur (admin uniquement)
export async function PATCH(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { uid, role, active, password, firstName, lastName, phone, contrat, etp } = body;

    if (!uid) {
      return NextResponse.json({ error: "UID requis" }, { status: 400 });
    }

    // Validation du rôle si fourni (QW-4)
    if (role !== undefined && !VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: `Rôle invalide. Rôles acceptés : ${VALID_ROLES.join(", ")}` },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (role) updateData.role = role;

    if (typeof active === "boolean") {
      updateData.active = active;
      await adminAuth.updateUser(uid, { disabled: !active });
    }

    if (firstName !== undefined) updateData.firstName = firstName || FieldValue.delete();
    if (lastName !== undefined) updateData.lastName = lastName || FieldValue.delete();
    if (phone !== undefined) updateData.phone = phone || FieldValue.delete();
    if (contrat !== undefined) updateData.contrat = contrat || FieldValue.delete();
    if (etp !== undefined) updateData.etp = etp || FieldValue.delete();

    if (Object.keys(updateData).length > 0) {
      await adminDb.collection("users").doc(uid).update(updateData);
    }

    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: "Le mot de passe doit contenir au moins 6 caractères" },
          { status: 400 }
        );
      }
      await adminAuth.updateUser(uid, { password });
    }

    try {
      const userDoc = await adminDb.collection("users").doc(uid).get();
      const targetUserEmail = (userDoc.data() as Record<string, unknown>)?.email ?? uid;

      const changes: Record<string, unknown> = {};
      if (role) changes.role = role;
      if (typeof active === "boolean") changes.active = active;
      if (password) changes.password = "***";
      if (firstName !== undefined) changes.firstName = firstName || "(supprimé)";
      if (lastName !== undefined) changes.lastName = lastName || "(supprimé)";
      if (phone !== undefined) changes.phone = phone || "(supprimé)";
      if (contrat !== undefined) changes.contrat = contrat || "(supprimé)";
      if (etp !== undefined) changes.etp = etp || "(supprimé)";

      const changeDescription = Object.entries(changes)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ");

      await adminDb.collection("logs").add({
        level: "info",
        action: "user_updated",
        userId: auth.userId,
        userEmail: auth.userEmail,
        description: `Modification de l'utilisateur ${targetUserEmail} (${changeDescription})`,
        metadata: { targetUserEmail, changes },
        timestamp: FieldValue.serverTimestamp(),
      });
    } catch (logError) {
      console.error("Erreur lors de l'enregistrement du log:", logError);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Erreur PATCH user:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un utilisateur (admin uniquement)
export async function DELETE(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json({ error: "UID requis" }, { status: 400 });
    }

    const userDoc = await adminDb.collection("users").doc(uid).get();
    const deletedUserEmail = (userDoc.data() as Record<string, unknown>)?.email ?? uid;

    await adminAuth.deleteUser(uid);
    await adminDb.collection("users").doc(uid).delete();

    try {
      await adminDb.collection("logs").add({
        level: "warning",
        action: "user_deleted",
        userId: auth.userId,
        userEmail: auth.userEmail,
        description: `Suppression de l'utilisateur ${deletedUserEmail}`,
        metadata: { deletedUserEmail },
        timestamp: FieldValue.serverTimestamp(),
      });
    } catch (logError) {
      console.error("Erreur lors de l'enregistrement du log:", logError);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Erreur DELETE user:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
