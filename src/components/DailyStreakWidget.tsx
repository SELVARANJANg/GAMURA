import React, { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Flame, Award, Zap } from "lucide-react";

interface DailyStreakWidgetProps {
  db: any;
  currentUser: any;
  showToast: (icon: string, title: string, desc: string) => void;
}

export const DailyStreakWidget: React.FC<DailyStreakWidgetProps> = ({ db, currentUser, showToast }) => {
  const [streakCount, setStreakCount] = useState<number>(5);
  const [points, setPoints] = useState<number>(450);
  const [claimedToday, setClaimedToday] = useState<boolean>(false);
  const [badges, setBadges] = useState<string[]>(["5-Day Streak", "Quantum Pioneer", "Guardian Core"]);

  useEffect(() => {
    const cachedStreak = localStorage.getItem("universe_streak_data");
    if (cachedStreak) {
      try {
        const parsed = JSON.parse(cachedStreak);
        setStreakCount(parsed.streakCount || 5);
        setPoints(parsed.points || 450);
        setClaimedToday(parsed.claimedToday || false);
        if (parsed.badges) setBadges(parsed.badges);
      } catch (e) {}
    }

    if (!currentUser || !db) return;
    const fetchStreak = async () => {
      try {
        const ref = doc(db, "user_streaks", currentUser.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setStreakCount(data.streakCount || 5);
          setPoints(data.points || 450);
          setClaimedToday(data.claimedToday || false);
          if (data.badges) setBadges(data.badges);
        }
      } catch (err: any) {
        console.log("Firestore offline or unavailable, using local cache for streak.");
      }
    };
    fetchStreak();
  }, [currentUser, db]);

  const handleClaimDaily = async () => {
    if (claimedToday) {
      showToast("⚠️", "Already Claimed", "You have already checked in today.");
      return;
    }
    const newStreak = streakCount + 1;
    const newPoints = points + 50;
    setStreakCount(newStreak);
    setPoints(newPoints);
    setClaimedToday(true);

    const updatedData = {
      streakCount: newStreak,
      points: newPoints,
      claimedToday: true,
      lastLogin: new Date().toISOString(),
      badges
    };

    localStorage.setItem("universe_streak_data", JSON.stringify(updatedData));
    showToast("🔥", "Daily Streak Claimed", `+50 PTS added. Streak is now ${newStreak} days.`);

    if (currentUser && db) {
      try {
        const ref = doc(db, "user_streaks", currentUser.uid);
        await setDoc(ref, updatedData, { merge: true });
      } catch (err: any) {
        console.log("Firestore offline, saved to local storage instead.");
      }
    }
  };

  const daysOfWeek = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div className="bg-white border border-zinc-200/80 rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-3 font-sans text-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-100 text-orange-500 flex items-center justify-center shrink-0">
            <Flame size={14} className="fill-orange-500" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-zinc-900 tracking-tight leading-tight">Daily Streak</h3>
            <p className="text-[10px] text-zinc-500 leading-tight">Weekly Check-In & Rewards</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-sm font-bold text-zinc-900 block leading-tight">{streakCount} Days</span>
          <span className="text-[10px] text-emerald-600 font-medium block">Active</span>
        </div>
      </div>

      {/* Compact Streak Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] font-medium text-zinc-500">
          <span>Consistency</span>
          <span className="text-zinc-900 font-semibold">{streakCount % 7 || 7}/7 days</span>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {daysOfWeek.map((day, idx) => {
            const isCompleted = idx < (streakCount % 7 || 7);
            return (
              <div
                key={idx}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl border text-[10px] font-medium transition-all ${
                  isCompleted
                    ? "bg-zinc-900 text-white border-zinc-900 font-semibold shadow-xs"
                    : "bg-zinc-50 text-zinc-400 border-zinc-200/70"
                }`}
              >
                <span>{day}</span>
                <span className="text-[9px] mt-0.5 leading-none">{isCompleted ? "✓" : "•"}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Points & Claim Section */}
      <div className="bg-zinc-50 border border-zinc-200/70 rounded-xl p-2.5 flex items-center justify-between gap-2">
        <div>
          <span className="text-[10px] text-zinc-500 font-medium block">Points Balance</span>
          <span className="text-xs font-bold text-zinc-900 flex items-center gap-1 mt-0.5">
            <Zap size={12} className="text-amber-500 fill-amber-500" /> {points} PTS
          </span>
        </div>
        <button
          onClick={handleClaimDaily}
          disabled={claimedToday}
          className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
            claimedToday
              ? "bg-zinc-200 text-zinc-500 cursor-not-allowed"
              : "bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.98] shadow-xs"
          }`}
        >
          {claimedToday ? "Checked In" : "Claim +50"}
        </button>
      </div>

      {/* Compact Badges */}
      <div className="flex flex-wrap gap-1.5 pt-1 border-t border-zinc-100">
        {badges.map((badge, idx) => (
          <span
            key={idx}
            className="px-2 py-0.5 bg-zinc-50 border border-zinc-200/70 rounded-lg text-[10px] font-medium text-zinc-700 flex items-center gap-1"
          >
            <Award size={10} className="text-zinc-500" /> {badge}
          </span>
        ))}
      </div>
    </div>
  );
};
