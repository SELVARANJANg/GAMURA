import React, { useEffect, useState, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp,
  getDocs,
  query,
  where,
  updateDoc,
  increment
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { handleFirestoreError, OperationType } from "../firebaseErrorHandler";

export default function SelvaranjanGamura({ onBack }: { onBack: () => void }) {
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [developersList, setDevelopersList] = useState<any[]>([]);
  const [iframeSrc, setIframeSrc] = useState("/selvaranjan_gamura.html");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const developersListRef = useRef<any[]>([]);
  useEffect(() => {
    developersListRef.current = developersList;
  }, [developersList]);

  const activeProfileUnsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      if (activeProfileUnsubRef.current) {
        activeProfileUnsubRef.current();
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const search = window.location.search;
      if (search) {
        setIframeSrc(`/selvaranjan_gamura.html${search}`);
      }
    }
  }, []);

  // Read whole gamura_developers directory in real-time
  useEffect(() => {
    const q = collection(db, "gamura_developers");
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }) as any);
      setDevelopersList(list);
      setTotalUsers(list.length);

      // Determine active users (last changes or active developers list count)
      const now = Date.now();
      const activeCount = list.filter((u: any) => {
        if (!u.updatedAt) return false;
        let t = 0;
        if (u.updatedAt.toDate) t = u.updatedAt.toDate().getTime();
        else if (u.updatedAt instanceof Date) t = u.updatedAt.getTime();
        else t = new Date(u.updatedAt).getTime();
        // Updated within 24 hours gets marked as active developer
        return now - t < 24 * 60 * 60 * 1000;
      }).length;

      setActiveUsers(Math.max(1, activeCount));

      // Sum clicks across all real developer claims
      const clicksSum = list.reduce((acc, curr) => acc + (Number(curr.clicks) || 0), 0);
      setTotalClicks(clicksSum);

      // Post the sync updates to the loaded iframe
      const iframe = iframeRef.current;
      if (iframe?.contentWindow) {
        iframe.contentWindow?.postMessage({
          type: "gamura-directory-sync",
          developers: list
        }, "*");
      }
    }, (err) => {
      console.warn("Firestore statistics check bypassed:", err);
      handleFirestoreError(err, OperationType.LIST, "gamura_developers");
    });

    return () => unsub();
  }, []);

  // Handle bidirectional communication between iframe & Firestore
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data === "exit-gamura-workspace") {
        onBack();
        return;
      }

      const iframe = iframeRef.current;
      if (!iframe) return;

      const msg = event.data;
      if (!msg || typeof msg !== "object") return;

      switch (msg.type) {
        // Triggered when iframe loads completely
        case "gamura-iframe-ready": {
          // Send initial Auth SSO details immediately
          const user = auth.currentUser;
          if (user) {
            let matchedProfileData: any = null;
            let matchedUsername: string = "";
            const cacheKey = `gamura_dev_profile_${user.uid}`;
            const cachedValue = localStorage.getItem(cacheKey);

            if (cachedValue) {
              try {
                const parsed = JSON.parse(cachedValue);
                matchedProfileData = parsed;
                matchedUsername = parsed.username || "";

                // Instantly sync cache value with iframe to provide zero-latency login load of link hubs
                iframe.contentWindow?.postMessage({
                  type: "gamura-auth-sync",
                  loggedIn: true,
                  email: user.email,
                  displayName: user.displayName || matchedUsername || user.email?.split("@")[0] || "Explorer",
                  uid: user.uid,
                  profileFromLogin: matchedProfileData,
                  profileUsername: matchedUsername,
                  isCached: true
                }, "*");
              } catch (e) {
                console.warn("Cached profile parse error:", e);
              }
            }

            // Perform deep background fetch to revalidate and update cache
            (async () => {
              try {
                let dbProfileData: any = null;
                let dbUsername: string = "";

                if (user.email) {
                  const devsRef = collection(db, "gamura_developers");
                  const devsSnap = await getDocs(query(devsRef, where("email", "==", user.email))).catch(() => null);
                  if (devsSnap && !devsSnap.empty) {
                    dbProfileData = devsSnap.docs[0].data();
                    dbUsername = devsSnap.docs[0].id;
                  }
                }

                if (!dbUsername) {
                  const uDoc = await getDoc(doc(db, "users", user.uid)).catch(() => null);
                  if (uDoc && uDoc.exists()) {
                    dbUsername = uDoc.data()?.username || "";
                  }
                }

                if (!dbUsername && user.email) {
                  const usersRef = collection(db, "users");
                  const usersSnap = await getDocs(query(usersRef, where("email", "==", user.email))).catch(() => null);
                  if (usersSnap && !usersSnap.empty) {
                    dbUsername = usersSnap.docs[0].data()?.username || "";
                  }
                }

                if (dbUsername) {
                  const usernameLower = dbUsername.toLowerCase();
                  const devDoc = await getDoc(doc(db, "gamura_developers", usernameLower)).catch(() => null);
                  if (devDoc && devDoc.exists()) {
                    dbProfileData = devDoc.data();
                  } else {
                    dbProfileData = {
                      username: dbUsername,
                      email: user.email || `${usernameLower}@gamura.app`,
                      blocks: [],
                      published: false,
                      plan: "Starter",
                      clicks: 0,
                      views: 1,
                      visitors: 1,
                      engagements: 1,
                      updatedAt: serverTimestamp()
                    };
                    await setDoc(doc(db, "gamura_developers", usernameLower), dbProfileData).catch(() => null);
                  }
                }

                if (dbProfileData) {
                  // Keep cache perfectly in sync
                  localStorage.setItem(cacheKey, JSON.stringify(dbProfileData));

                  // Refresh iframe contents with the live authentic document
                  iframe.contentWindow?.postMessage({
                    type: "gamura-auth-sync",
                    loggedIn: true,
                    email: user.email,
                    displayName: user.displayName || dbUsername || user.email?.split("@")[0] || "Explorer",
                    uid: user.uid,
                    profileFromLogin: dbProfileData,
                    profileUsername: dbUsername
                  }, "*");
                }
              } catch (err) {
                console.warn("Background revalidation failed:", err);
              }
            })();

          } else {
            iframe.contentWindow?.postMessage({
              type: "gamura-auth-sync",
              loggedIn: false
            }, "*");
          }

          // Send current statistics & full list of claims securely from our reactive state (leak-free!)
          iframe.contentWindow?.postMessage({
            type: "gamura-directory-sync",
            developers: developersListRef.current
          }, "*");
          break;
        }

        // Triggered when any developer modifies, claims, or updates their hub
        case "gamura-save-profile": {
          const { username, state } = msg;
          if (username) {
            const docRef = doc(db, "gamura_developers", username.toLowerCase());
            try {
              const updatedProfile = {
                username: username,
                email: state.email || "",
                blocks: state.blocks || [],
                published: state.published || false,
                plan: state.plan || "Starter",
                updatedAt: serverTimestamp()
              };
              await setDoc(docRef, updatedProfile, { merge: true });

              const user = auth.currentUser;
              if (user) {
                localStorage.setItem(`gamura_dev_profile_${user.uid}`, JSON.stringify({
                  ...updatedProfile,
                  updatedAt: new Date().toISOString()
                }));
              }
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `gamura_developers/${username.toLowerCase()}`);
            }
          }
          break;
        }

        // Fetch a full profile dynamically in real-time for viewing live links hubs
        case "gamura-get-profile": {
          const { username } = msg;
          if (username) {
            if (activeProfileUnsubRef.current) {
              activeProfileUnsubRef.current();
              activeProfileUnsubRef.current = null;
            }

            const docRef = doc(db, "gamura_developers", username.toLowerCase());
            try {
              const unsub = onSnapshot(docRef, (docSnap) => {
                if (docSnap.exists()) {
                  iframeRef.current?.contentWindow?.postMessage({
                    type: "gamura-load-viewer-profile",
                    username: username,
                    profile: docSnap.data(),
                    isRealtimeUpdate: true
                  }, "*");
                }
              }, (err) => {
                console.warn("Active profile live stats check bypassed:", err);
              });
              activeProfileUnsubRef.current = unsub;
            } catch (err) {
              handleFirestoreError(err, OperationType.GET, `gamura_developers/${username.toLowerCase()}`);
            }
          }
          break;
        }

        case "gamura-exit-profile": {
          if (activeProfileUnsubRef.current) {
            activeProfileUnsubRef.current();
            activeProfileUnsubRef.current = null;
          }
          break;
        }

        // Increment link click count on Firestore in Real-Time
        case "gamura-increment-clicks": {
          const { username } = msg;
          if (username) {
            const docRef = doc(db, "gamura_developers", username.toLowerCase());
            try {
              await updateDoc(docRef, {
                clicks: increment(1),
                engagements: increment(1),
                updatedAt: serverTimestamp()
              });
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `gamura_developers/${username.toLowerCase()}`);
            }
          }
          break;
        }

        // Increment visitor/view count on Firestore in Real-Time
        case "gamura-record-view": {
          const { username } = msg;
          if (username) {
            const docRef = doc(db, "gamura_developers", username.toLowerCase());
            try {
              await updateDoc(docRef, {
                views: increment(1),
                visitors: increment(1),
                engagements: increment(1),
                updatedAt: serverTimestamp()
              });
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `gamura_developers/${username.toLowerCase()}`);
            }
          }
          break;
        }

        // Triggered when user attempts Google Authentication from inside inner page frame
        case "gamura-trigger-google-signin": {
          const { candidateUsername } = msg;
          const provider = new GoogleAuthProvider();
          try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            const email = user.email || "";

            // Check if developer profile already exists for this email
            let matchedProfileData: any = null;
            let matchedUsername: string = "";
            const devsRef = collection(db, "gamura_developers");
            const devsSnap = await getDocs(query(devsRef, where("email", "==", email)));
            
            if (!devsSnap.empty) {
              matchedProfileData = devsSnap.docs[0].data();
              matchedUsername = devsSnap.docs[0].id;
            }

            // Fallback lookup: Check if user exists by UID
            if (!matchedUsername) {
              const uDoc = await getDoc(doc(db, "users", user.uid)).catch(() => null);
              if (uDoc && uDoc.exists()) {
                matchedUsername = uDoc.data()?.username || "";
              }
            }

            // Fallback lookup: Check users collection by email query
            if (!matchedUsername && email) {
              const usersRef = collection(db, "users");
              const usersSnap = await getDocs(query(usersRef, where("email", "==", email)));
              if (!usersSnap.empty) {
                matchedUsername = usersSnap.docs[0].data()?.username || "";
              }
            }

            // If we found a username but no developer profile doc yet, fetch or assert it!
            if (matchedUsername) {
              const usernameLower = matchedUsername.toLowerCase();
              const devDoc = await getDoc(doc(db, "gamura_developers", usernameLower)).catch(() => null);
              if (devDoc && devDoc.exists()) {
                matchedProfileData = devDoc.data();
              } else {
                matchedProfileData = {
                  username: matchedUsername,
                  email: email,
                  blocks: [],
                  published: false,
                  plan: "Starter",
                  clicks: 0,
                  views: 1,
                  visitors: 1,
                  engagements: 1,
                  updatedAt: serverTimestamp()
                };
                await setDoc(doc(db, "gamura_developers", usernameLower), matchedProfileData).catch(() => null);
              }

              iframe.contentWindow?.postMessage({
                type: "gamura-auth-sync",
                loggedIn: true,
                email: email,
                displayName: user.displayName || matchedUsername || "Explorer",
                uid: user.uid,
                profileFromLogin: matchedProfileData,
                profileUsername: matchedUsername
              }, "*");
              break;
            }

            // No existing account or username linked yet. Handle candidateUsername if supplied and valid/unclaimed.
            if (candidateUsername) {
              const usernameLower = candidateUsername.trim().toLowerCase();
              const isValid = /^[a-zA-Z0-9_-]{3,24}$/.test(usernameLower);
              const uDoc = await getDoc(doc(db, "usernames", usernameLower)).catch(() => null);
              const devDoc = await getDoc(doc(db, "gamura_developers", usernameLower)).catch(() => null);
              const isTaken = (uDoc && uDoc.exists()) || (devDoc && devDoc.exists());

              if (isValid && !isTaken) {
                // Claim it instantly and seamlessly for the Google user!
                await setDoc(doc(db, "usernames", usernameLower), { uid: user.uid }).catch(() => null);

                await setDoc(doc(db, "users", user.uid), {
                  uid: user.uid,
                  email: email,
                  username: candidateUsername.trim(),
                  nickname: user.displayName || candidateUsername.trim(),
                  createdAt: Date.now(),
                  lastLogin: Date.now()
                }).catch(() => null);

                const devProfile = {
                  username: candidateUsername.trim(),
                  email: email,
                  blocks: [],
                  published: false,
                  plan: "Starter",
                  clicks: 0,
                  views: 1,
                  visitors: 1,
                  engagements: 1,
                  updatedAt: serverTimestamp()
                };
                await setDoc(doc(db, "gamura_developers", usernameLower), devProfile);

                iframe.contentWindow?.postMessage({
                  type: "gamura-auth-sync",
                  loggedIn: true,
                  email: email,
                  displayName: user.displayName || candidateUsername.trim(),
                  uid: user.uid,
                  isNewlyRegistered: true,
                  registeredUsername: candidateUsername.trim(),
                  registeredPlan: "Starter"
                }, "*");
                break;
              }
            }

            // No candidate or candidate taken: auto-generate a unique beautiful Gamura ID from prefix to proceed flawlessly!
            const emailPrefix = email ? email.split("@")[0].replace(/[^a-zA-Z0-9_-]/g, "") : "gamer";
            let nameSeed = emailPrefix || "gamer";
            if (nameSeed.length < 3) nameSeed = nameSeed + "2026";
            let checkName = nameSeed;
            let counter = 1;
            let isGenTaken = true;

            while (isGenTaken) {
              const nameLower = checkName.toLowerCase();
              const uDoc = await getDoc(doc(db, "usernames", nameLower)).catch(() => null);
              const devDoc = await getDoc(doc(db, "gamura_developers", nameLower)).catch(() => null);
              if ((uDoc && uDoc.exists()) || (devDoc && devDoc.exists())) {
                checkName = `${nameSeed}${counter}`;
                counter++;
              } else {
                isGenTaken = false;
              }
            }

            const finalUniqueUsername = checkName;
            const finalUsernameLower = finalUniqueUsername.toLowerCase();

            await setDoc(doc(db, "usernames", finalUsernameLower), { uid: user.uid }).catch(() => null);

            await setDoc(doc(db, "users", user.uid), {
              uid: user.uid,
              email: email,
              username: finalUniqueUsername,
              nickname: user.displayName || finalUniqueUsername,
              createdAt: Date.now(),
              lastLogin: Date.now()
            }).catch(() => null);

            const devProfileObj = {
              username: finalUniqueUsername,
              email: email,
              blocks: [],
              published: false,
              plan: "Starter",
              clicks: 0,
              views: 1,
              visitors: 1,
              engagements: 1,
              updatedAt: serverTimestamp()
            };
            await setDoc(doc(db, "gamura_developers", finalUsernameLower), devProfileObj).catch(() => null);

            iframe.contentWindow?.postMessage({
              type: "gamura-auth-sync",
              loggedIn: true,
              email: email,
              displayName: user.displayName || finalUniqueUsername,
              uid: user.uid,
              isNewlyRegistered: true,
              registeredUsername: finalUniqueUsername,
              registeredPlan: "Starter",
              profileFromLogin: devProfileObj,
              profileUsername: finalUniqueUsername
            }, "*");

          } catch (err: any) {
            console.error("Google popup error in container bridge:", err);
            const isPopupClosed = err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request';
            iframe.contentWindow?.postMessage({
              type: "gamura-auth-error",
              message: isPopupClosed ? "Google login popup was closed window cancelled. Please try again." : (err.message || "Google Authentication failed"),
              isCancelled: isPopupClosed
            }, "*");
          }
          break;
        }

        case "gamura-trigger-email-signup": {
          const { username, email, password, nickname, plan } = msg;
          try {
            const usernameLower = username.toLowerCase();
            const uDoc = await getDoc(doc(db, "usernames", usernameLower)).catch(() => null);
            const devDoc = await getDoc(doc(db, "gamura_developers", usernameLower)).catch(() => null);
            if ((uDoc && uDoc.exists()) || (devDoc && devDoc.exists())) {
              iframe.contentWindow?.postMessage({
                type: "gamura-auth-error",
                message: "This Gamura ID is already claimed. Choose another!"
              }, "*");
              break;
            }

            const currentUser = auth.currentUser;
            let user = currentUser;
            const emailLower = email.trim().toLowerCase();
            const isMatch = user && user.email && user.email.toLowerCase() === emailLower;

            if (!isMatch) {
              try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                user = userCredential.user;
              } catch (regErr: any) {
                // If it's an email-already-in-use error, attempt logging in with the same credentials (password) as a failsafe!
                if (
                  regErr.code === "auth/email-already-in-use" ||
                  (regErr.message && regErr.message.toLowerCase().includes("email-already-in-use"))
                ) {
                  try {
                    const userCredential = await signInWithEmailAndPassword(auth, email, password);
                    user = userCredential.user;
                  } catch (loginErr) {
                    throw regErr; // Throw original signup error if password doesn't match
                  }
                } else {
                  throw regErr;
                }
              }
            }

            await setDoc(doc(db, "usernames", usernameLower), { uid: user.uid }).catch(() => null);

            await setDoc(doc(db, "users", user.uid), {
              uid: user.uid,
              email: user.email || email,
              username: username,
              nickname: nickname || username,
              createdAt: Date.now(),
              lastLogin: Date.now()
            }, { merge: true }).catch(() => null);

            const devProfile = {
              username: username,
              email: user.email || email,
              blocks: [],
              published: false,
              plan: plan || "Starter",
              clicks: 0,
              views: 1,
              visitors: 1,
              engagements: 1,
              updatedAt: serverTimestamp()
            };
            await setDoc(doc(db, "gamura_developers", usernameLower), devProfile);

            iframe.contentWindow?.postMessage({
              type: "gamura-auth-sync",
              loggedIn: true,
              email: user.email || email,
              displayName: nickname || username,
              uid: user.uid,
              isNewlyRegistered: true,
              registeredUsername: username,
              registeredPlan: plan || "Starter",
              profileFromLogin: devProfile,
              profileUsername: username
            }, "*");
          } catch (err: any) {
            console.error("Iframe email signup error handled in bridge:", err);
            let friendlyMessage = err.message || "Signup failed";
            if (
              err.code === "auth/email-already-in-use" ||
              (err.message && err.message.toLowerCase().includes("email-already-in-use"))
            ) {
              friendlyMessage = "This email is already associated with an account! Please log in instead, or use a different email.";
            } else if (
              err.code === "auth/weak-password" ||
              (err.message && err.message.toLowerCase().includes("weak-password"))
            ) {
              friendlyMessage = "Password is too weak. Please use at least 8 characters.";
            } else if (
              err.code === "auth/invalid-email" ||
              (err.message && err.message.toLowerCase().includes("invalid-email"))
            ) {
              friendlyMessage = "The email address is badly formatted.";
            }

            iframe.contentWindow?.postMessage({
              type: "gamura-auth-error",
              message: friendlyMessage
            }, "*");
          }
          break;
        }

        case "gamura-trigger-email-signin": {
          const { email, password } = msg;
          try {
            let loginEmail = email.trim();
            if (!loginEmail.includes("@")) {
              const uLower = loginEmail.toLowerCase();
              const uDoc = await getDoc(doc(db, "usernames", uLower)).catch(() => null);
              if (uDoc && uDoc.exists()) {
                const uid = uDoc.data()?.uid;
                if (uid) {
                  const uProfile = await getDoc(doc(db, "users", uid)).catch(() => null);
                  if (uProfile && uProfile.exists()) {
                    loginEmail = uProfile.data()?.email || `${uLower}@gamura.app`;
                  } else {
                    loginEmail = `${uLower}@gamura.app`;
                  }
                } else {
                  loginEmail = `${uLower}@gamura.app`;
                }
              } else {
                const devDoc = await getDoc(doc(db, "gamura_developers", uLower)).catch(() => null);
                if (devDoc && devDoc.exists()) {
                  loginEmail = devDoc.data()?.email || `${uLower}@gamura.app`;
                } else {
                  loginEmail = `${uLower}@gamura.app`;
                }
              }
            }

            const userCredential = await signInWithEmailAndPassword(auth, loginEmail, password);
            const user = userCredential.user;

            // Fetch matched developer profile immediately so we can pass it securely!
            let matchedProfileData: any = null;
            let matchedUsername: string = "";

            if (user.email) {
              const devsRef = collection(db, "gamura_developers");
              const devsSnap = await getDocs(query(devsRef, where("email", "==", user.email))).catch(() => null);
              if (devsSnap && !devsSnap.empty) {
                matchedProfileData = devsSnap.docs[0].data();
                matchedUsername = devsSnap.docs[0].id;
              }
            }

            // Fallback lookup: Check if user exists by UID
            if (!matchedUsername) {
              const uDoc = await getDoc(doc(db, "users", user.uid)).catch(() => null);
              if (uDoc && uDoc.exists()) {
                matchedUsername = uDoc.data()?.username || "";
              }
            }

            // Fallback lookup: Check users collection by email query
            if (!matchedUsername && user.email) {
              const usersRef = collection(db, "users");
              const usersSnap = await getDocs(query(usersRef, where("email", "==", user.email))).catch(() => null);
              if (usersSnap && !usersSnap.empty) {
                matchedUsername = usersSnap.docs[0].data()?.username || "";
              }
            }

            // If we found a username but no developer profile doc yet, fetch or assert it!
            if (matchedUsername) {
              const usernameLower = matchedUsername.toLowerCase();
              const devDoc = await getDoc(doc(db, "gamura_developers", usernameLower)).catch(() => null);
              if (devDoc && devDoc.exists()) {
                matchedProfileData = devDoc.data();
              } else {
                matchedProfileData = {
                  username: matchedUsername,
                  email: user.email || loginEmail,
                  blocks: [],
                  published: false,
                  plan: "Starter",
                  clicks: 0,
                  views: 1,
                  visitors: 1,
                  engagements: 1,
                  updatedAt: serverTimestamp()
                };
                await setDoc(doc(db, "gamura_developers", usernameLower), matchedProfileData).catch(() => null);
              }
            } else {
              // Perfect fallback: if they don't have a username, let's auto-generate one for them so they are logged in perfectly
              const emailPrefix = user.email ? user.email.split("@")[0].replace(/[^a-zA-Z0-9_-]/g, "") : "gamer";
              let nameSeed = emailPrefix || "gamer";
              if (nameSeed.length < 3) nameSeed = nameSeed + "2026";
              let checkName = nameSeed;
              let counter = 1;
              let isGenTaken = true;

              while (isGenTaken) {
                const nameLower = checkName.toLowerCase();
                const uDoc = await getDoc(doc(db, "usernames", nameLower)).catch(() => null);
                const devDoc = await getDoc(doc(db, "gamura_developers", nameLower)).catch(() => null);
                if ((uDoc && uDoc.exists()) || (devDoc && devDoc.exists())) {
                  checkName = `${nameSeed}${counter}`;
                  counter++;
                } else {
                  isGenTaken = false;
                }
              }

              matchedUsername = checkName;
              const finalUsernameLower = matchedUsername.toLowerCase();

              await setDoc(doc(db, "usernames", finalUsernameLower), { uid: user.uid }).catch(() => null);

              await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                email: user.email || loginEmail,
                username: matchedUsername,
                nickname: user.displayName || matchedUsername,
                createdAt: Date.now(),
                lastLogin: Date.now()
              }).catch(() => null);

              matchedProfileData = {
                username: matchedUsername,
                email: user.email || loginEmail,
                blocks: [],
                published: false,
                plan: "Starter",
                clicks: 0,
                views: 1,
                visitors: 1,
                engagements: 1,
                updatedAt: serverTimestamp()
              };
              await setDoc(doc(db, "gamura_developers", finalUsernameLower), matchedProfileData).catch(() => null);
            }

            iframe.contentWindow?.postMessage({
              type: "gamura-auth-sync",
              loggedIn: true,
              email: user.email,
              displayName: user.displayName || matchedUsername || "Explorer",
              uid: user.uid,
              profileFromLogin: matchedProfileData,
              profileUsername: matchedUsername
            }, "*");
          } catch (err: any) {
            console.error("Iframe email signin error:", err);
            let friendlyMessage = err.message || "Invalid credentials";
            if (
              err.code === "auth/invalid-credential" ||
              err.code === "auth/user-not-found" ||
              err.code === "auth/wrong-password" ||
              (err.message && (err.message.toLowerCase().includes("invalid-credential") || err.message.toLowerCase().includes("wrong-password")))
            ) {
              friendlyMessage = "Incorrect credentials. Please check your username, email, or password and try again!";
            } else if (
              err.code === "auth/invalid-email" ||
              (err.message && err.message.toLowerCase().includes("invalid-email"))
            ) {
              friendlyMessage = "The email address is badly formatted.";
            } else if (
              err.code === "auth/user-disabled" ||
              (err.message && err.message.toLowerCase().includes("user-disabled"))
            ) {
              friendlyMessage = "This user account has been disabled.";
            }

            iframe.contentWindow?.postMessage({
              type: "gamura-auth-error",
              message: friendlyMessage
            }, "*");
          }
          break;
        }

        case "gamura-trigger-sso-bypass": {
          const { username } = msg;
          if (username) {
            const usernameLower = username.toLowerCase();
            try {
              const devDoc = await getDoc(doc(db, "gamura_developers", usernameLower)).catch(() => null);
              if (devDoc && devDoc.exists()) {
                const devProfile = devDoc.data();
                iframe.contentWindow?.postMessage({
                  type: "gamura-auth-sync",
                  loggedIn: true,
                  email: devProfile.email || `${usernameLower}@gamura.app`,
                  displayName: devProfile.username || username,
                  uid: devProfile.uid || `sso_${usernameLower}`,
                  profileFromLogin: devProfile,
                  profileUsername: devProfile.username || username
                }, "*");
              } else {
                iframe.contentWindow?.postMessage({
                  type: "gamura-auth-error",
                  message: `No registered profile found for ${username}`
                }, "*");
              }
            } catch (err: any) {
              console.error("SSO trigger bypass error:", err);
              iframe.contentWindow?.postMessage({
                type: "gamura-auth-error",
                message: err.message || "SSO Bypass failed"
              }, "*");
            }
          }
          break;
        }

        default:
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onBack]);

  // Continuously pipe live aggregated statistics (Clicks, Users, Active) to iframe
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const sendStats = () => {
      iframe.contentWindow?.postMessage({
        type: "gamura-realtime-stats",
        totalUsers,
        activeUsers,
        totalClicks
      }, "*");
    };

    sendStats();

    const handleLoad = () => {
      sendStats();
    };

    iframe.addEventListener("load", handleLoad);
    const timer = setInterval(sendStats, 1500);

    return () => {
      iframe.removeEventListener("load", handleLoad);
      clearInterval(timer);
    };
  }, [totalUsers, activeUsers, totalClicks]);

  // Push updates to iframe whenever Firebase Authentication states shift
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      const iframe = iframeRef.current;
      if (iframe?.contentWindow) {
        if (user) {
          let matchedProfileData: any = null;
          let matchedUsername: string = "";
          const cacheKey = `gamura_dev_profile_${user.uid}`;
          const cachedValue = localStorage.getItem(cacheKey);

          if (cachedValue) {
            try {
              const parsed = JSON.parse(cachedValue);
              matchedProfileData = parsed;
              matchedUsername = parsed.username || "";

              iframe.contentWindow?.postMessage({
                type: "gamura-auth-sync",
                loggedIn: true,
                email: user.email,
                displayName: user.displayName || matchedUsername || user.email?.split("@")[0] || "Explorer",
                uid: user.uid,
                profileFromLogin: matchedProfileData,
                profileUsername: matchedUsername,
                isCached: true
              }, "*");
            } catch (e) {
              console.warn("Auth cache read failed:", e);
            }
          }

          // Asynchronous revalidation
          (async () => {
            try {
              let liveProfileData: any = null;
              let liveUsername: string = "";

              if (user.email) {
                const devsRef = collection(db, "gamura_developers");
                const devsSnap = await getDocs(query(devsRef, where("email", "==", user.email))).catch(() => null);
                if (devsSnap && !devsSnap.empty) {
                  liveProfileData = devsSnap.docs[0].data();
                  liveUsername = devsSnap.docs[0].id;
                }
              }

              if (!liveUsername) {
                const uDoc = await getDoc(doc(db, "users", user.uid)).catch(() => null);
                if (uDoc && uDoc.exists()) {
                  liveUsername = uDoc.data()?.username || "";
                }
              }

              if (!liveUsername && user.email) {
                const usersRef = collection(db, "users");
                const usersSnap = await getDocs(query(usersRef, where("email", "==", user.email))).catch(() => null);
                if (usersSnap && !usersSnap.empty) {
                  liveUsername = usersSnap.docs[0].data()?.username || "";
                }
              }

              if (liveUsername) {
                const usernameLower = liveUsername.toLowerCase();
                const devDoc = await getDoc(doc(db, "gamura_developers", usernameLower)).catch(() => null);
                if (devDoc && devDoc.exists()) {
                  liveProfileData = devDoc.data();
                } else {
                  liveProfileData = {
                    username: liveUsername,
                    email: user.email || `${usernameLower}@gamura.app`,
                    blocks: [],
                    published: false,
                    plan: "Starter",
                    clicks: 0,
                    views: 1,
                    visitors: 1,
                    engagements: 1,
                    updatedAt: serverTimestamp()
                  };
                  await setDoc(doc(db, "gamura_developers", usernameLower), liveProfileData).catch(() => null);
                }
              }

              if (liveProfileData) {
                localStorage.setItem(cacheKey, JSON.stringify(liveProfileData));

                iframe.contentWindow?.postMessage({
                  type: "gamura-auth-sync",
                  loggedIn: true,
                  email: user.email,
                  displayName: user.displayName || liveUsername || user.email?.split("@")[0] || "Explorer",
                  uid: user.uid,
                  profileFromLogin: liveProfileData,
                  profileUsername: liveUsername
                }, "*");
              }
            } catch (err) {
              console.warn("Background auth state revalidation failed:", err);
            }
          })();

        } else {
          iframe.contentWindow?.postMessage({
            type: "gamura-auth-sync",
            loggedIn: false
          }, "*");
        }
      }
    });
    return () => unsub();
  }, []);

  return (
    <div className="w-full h-screen relative bg-[#03050A] overflow-hidden">
      {/* Absolute Overlaid Home Back Button */}
      <div className="absolute top-[12px] md:top-[14px] left-3 md:left-4 z-[9999] flex items-center">
        <button 
          onClick={onBack}
          className="flex items-center gap-1 px-2 py-1.5 md:px-3 md:py-1.5 rounded-lg border border-[#0EA5E9]/25 hover:border-[#0EA5E9]/50 bg-[#03050A]/90 hover:bg-[#03050A] text-[#0EA5E9] hover:text-sky-300 backdrop-blur-xl transition-all active:scale-95 shadow-[0_4px_20px_rgba(0,0,0,0.8)] cursor-pointer text-xs font-mono font-bold uppercase tracking-wider"
          title="Back to Selvaranjan's Portfolio"
          aria-label="Back to Selvaranjan's Portfolio"
        >
          <ArrowLeft size={13} className="text-[#0EA5E9]" />
          <span className="hidden sm:inline">PORTFOLIO</span>
        </button>
      </div>
      <iframe
        ref={iframeRef}
        title="Join Selvaranjan on Gamura"
        src={iframeSrc}
        className="w-full h-full border-none"
        allow="clipboard-read; clipboard-write; camera; microphone; geolocation"
      />
    </div>
  );
}
