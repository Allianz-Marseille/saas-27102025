import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";

// Fonction d'initialisation paresseuse de Firebase Admin
function initializeFirebaseAdmin() {
  if (!admin.apps.length) {
    // Utiliser des variables d'environnement (pour Vercel) ou le fichier local (pour dev)
    let serviceAccount: admin.ServiceAccount;
    
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      // Production : utiliser les variables d'environnement (Vercel)
      serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      };
    } else {
      // Développement local : charger le fichier JSON dynamiquement
      // On évite d'utiliser require() directement pour éviter l'erreur au build
      const fs = require('fs');
      const path = require('path');
      
      try {
        const jsonPath = path.join(process.cwd(), 'saas-27102025-firebase-adminsdk-fbsvc-e5024f4d7c.json');
        const jsonData = fs.readFileSync(jsonPath, 'utf8');
        serviceAccount = JSON.parse(jsonData);
      } catch (error) {
        console.error("Firebase Admin credentials missing");
        throw new Error('Firebase Admin credentials are missing. Check environment variables or local JSON file.');
      }
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  
  return admin;
}

// GET - Liste tous les utilisateurs
export async function GET(request: NextRequest) {
  try {
    const adminInstance = initializeFirebaseAdmin();
    const auth = adminInstance.auth();
    const db = adminInstance.firestore();

    console.log("🔍 Début récupération des utilisateurs...");

    // Récupérer tous les utilisateurs Auth
    const listUsersResult = await auth.listUsers();
    console.log(`✅ ${listUsersResult.users.length} utilisateur(s) trouvé(s) dans Firebase Auth`);
    
    // Récupérer les données Firestore
    const usersSnapshot = await db.collection("users").get();
    console.log(`✅ ${usersSnapshot.size} document(s) trouvé(s) dans Firestore`);
    
    const usersData = new Map();
    usersSnapshot.forEach((doc) => {
      usersData.set(doc.id, doc.data());
    });

    const usersWithData = listUsersResult.users.map((user) => {
      const userData = usersData.get(user.uid) || {};
      return {
        uid: user.uid,
        email: user.email,
        role: userData.role || "CDC_COMMERCIAL",
        active: userData.active !== false,
        createdAt: user.metadata.creationTime,
        emailVerified: user.emailVerified,
        firstName: userData.firstName || undefined,
        lastName: userData.lastName || undefined,
        phone: userData.phone || undefined,
        contrat: userData.contrat || undefined,
        etp: userData.etp || undefined,
      };
    });

    console.log(`✅ ${usersWithData.length} utilisateur(s) préparé(s) pour l'envoi`);
    return NextResponse.json({ users: usersWithData });
  } catch (error: any) {
    console.error("❌ Erreur GET users:", error);
    console.error("Stack:", error.stack);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la récupération des utilisateurs" },
      { status: 500 }
    );
  }
}

// Rôles valides pour l'accès au dashboard (alignés avec lib/utils/roles et RouteGuard)
const VALID_ROLES = [
  "ADMINISTRATEUR",
  "CDC_COMMERCIAL",
  "COMMERCIAL_SANTE_INDIVIDUEL",
  "COMMERCIAL_SANTE_COLLECTIVE",
  "GESTIONNAIRE_SINISTRE",
] as const;

// POST - Créer un nouvel utilisateur
// Intègre automatiquement l'utilisateur dans tout le processus : Firebase Auth + Firestore (users).
// Le document Firestore (id, email, role, active) suffit pour l'accès au dashboard selon le rôle
// (redirection login + RouteGuard). Aucune autre création n'est requise pour l'accès.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, role } = body;

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: "Email, password et role requis" },
        { status: 400 }
      );
    }

    // Vérifier que le rôle est valide pour l'accès au dashboard
    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: `Rôle invalide. Rôles acceptés : ${VALID_ROLES.join(", ")}` },
        { status: 400 }
      );
    }

    // Vérifier le domaine email
    const ALLOWED_DOMAINS = ["@allianz-nogaro.fr"];
    const isValidDomain = ALLOWED_DOMAINS.some(domain => email.endsWith(domain));
    if (!isValidDomain) {
      return NextResponse.json(
        { error: `Email doit se terminer par ${ALLOWED_DOMAINS.join(' ou ')}` },
        { status: 400 }
      );
    }

    const adminInstance = initializeFirebaseAdmin();
    const auth = adminInstance.auth();
    const db = adminInstance.firestore();

    // Créer l'utilisateur dans Auth
    const userRecord = await auth.createUser({
      email,
      password,
      emailVerified: false,
    });

    // Créer le document Firestore
    await db.collection("users").doc(userRecord.uid).set({
      id: userRecord.uid,
      email,
      role,
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Logger la création (récupérer l'admin qui a fait l'action depuis les headers si disponible)
    const adminUserId = request.headers.get("x-user-id") || "admin";
    const adminEmail = request.headers.get("x-user-email") || "admin";
    
    try {
      await db.collection("logs").add({
        level: "success",
        action: "user_created",
        userId: adminUserId,
        userEmail: adminEmail,
        description: `Création d'un utilisateur ${email} avec le rôle ${role}`,
        metadata: { newUserEmail: email, role },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
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
  } catch (error: any) {
    console.error("Erreur POST user:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour un utilisateur
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, role, active, password, firstName, lastName, phone, contrat, etp } = body;

    if (!uid) {
      return NextResponse.json(
        { error: "UID requis" },
        { status: 400 }
      );
    }

    const adminInstance = initializeFirebaseAdmin();
    const auth = adminInstance.auth();
    const db = adminInstance.firestore();

    const updateData: Record<string, unknown> = {};

    // Mettre à jour le rôle dans Firestore
    if (role) {
      updateData.role = role;
    }

    // Mettre à jour active dans Firestore
    if (typeof active === "boolean") {
      updateData.active = active;
      // Désactiver/Activer l'utilisateur dans Auth aussi
      if (!active) {
        await auth.updateUser(uid, { disabled: true });
      } else {
        await auth.updateUser(uid, { disabled: false });
      }
    }

    // Mettre à jour firstName, lastName, phone, contrat, etp
    if (firstName !== undefined) {
      updateData.firstName = firstName || admin.firestore.FieldValue.delete();
    }
    if (lastName !== undefined) {
      updateData.lastName = lastName || admin.firestore.FieldValue.delete();
    }
    if (phone !== undefined) {
      updateData.phone = phone || admin.firestore.FieldValue.delete();
    }
    if (contrat !== undefined) {
      updateData.contrat = contrat || admin.firestore.FieldValue.delete();
    }
    if (etp !== undefined) {
      updateData.etp = etp || admin.firestore.FieldValue.delete();
    }

    // Appliquer les mises à jour Firestore si nécessaire
    if (Object.keys(updateData).length > 0) {
      await db.collection("users").doc(uid).update(updateData);
    }

    // Mettre à jour le mot de passe dans Auth
    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: "Le mot de passe doit contenir au moins 6 caractères" },
          { status: 400 }
        );
      }
      await auth.updateUser(uid, { password });
    }

    // Logger la modification
    const adminUserId = request.headers.get("x-user-id") || "admin";
    const adminEmail = request.headers.get("x-user-email") || "admin";
    
    try {
      // Récupérer l'email de l'utilisateur modifié
      const userDoc = await db.collection("users").doc(uid).get();
      const targetUserEmail = userDoc.data()?.email || uid;
      
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
      
      await db.collection("logs").add({
        level: "info",
        action: "user_updated",
        userId: adminUserId,
        userEmail: adminEmail,
        description: `Modification de l'utilisateur ${targetUserEmail} (${changeDescription})`,
        metadata: { targetUserEmail, changes },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (logError) {
      console.error("Erreur lors de l'enregistrement du log:", logError);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erreur PATCH user:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un utilisateur
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json(
        { error: "UID requis" },
        { status: 400 }
      );
    }

    const adminInstance = initializeFirebaseAdmin();
    const auth = adminInstance.auth();
    const db = adminInstance.firestore();

    // Récupérer l'email de l'utilisateur avant suppression pour le log
    const userDoc = await db.collection("users").doc(uid).get();
    const deletedUserEmail = userDoc.data()?.email || uid;

    // Supprimer de Auth
    await auth.deleteUser(uid);

    // Supprimer de Firestore
    await db.collection("users").doc(uid).delete();

    // Logger la suppression
    const adminUserId = request.headers.get("x-user-id") || "admin";
    const adminEmail = request.headers.get("x-user-email") || "admin";
    
    try {
      await db.collection("logs").add({
        level: "warning",
        action: "user_deleted",
        userId: adminUserId,
        userEmail: adminEmail,
        description: `Suppression de l'utilisateur ${deletedUserEmail}`,
        metadata: { deletedUserEmail },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (logError) {
      console.error("Erreur lors de l'enregistrement du log:", logError);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erreur DELETE user:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

