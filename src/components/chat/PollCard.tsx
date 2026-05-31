import React, { memo, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const BLUE = "#2563EB";
const BG = "#FFFFFF";
const BORDER = "#E5E7EB";
const TEXT = "#111827";
const MUTED = "#6B7280";
const GREEN = "#22C55E";
const RED = "#EF4444";

type PollOption = {
  id: string;
  text?: string;
  option_text?: string;
  votes?: number;
  vote_count?: number;
};

type Poll = {
  id: string;
  question: string;
  is_active?: boolean;
  total_votes?: number;
  my_vote_option_id?: string;
  options?: PollOption[];
};

type Props = {
  item: any;
  isMine?: boolean;
  goalClassID: string;
  isTeacherOrAdmin?: boolean;
  onVote: (pollID: string, optionID: string) => Promise<void>;
  onClose?: (pollID: string) => Promise<void>;
};

function PollCard({
  item,
  isMine = false,
  isTeacherOrAdmin = false,
  onVote,
  onClose,
}: Props) {
  const poll: Poll | null = item?.poll || null;
  const [loadingOption, setLoadingOption] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);

  const options = poll?.options || [];
  const totalVotes = Number(poll?.total_votes || 0);
  const isActive = poll?.is_active !== false;
  const myVote = poll?.my_vote_option_id || "";

  const question = poll?.question || item?.body || "Poll";

  const canVote = Boolean(poll?.id && isActive && !myVote);

  const handleVote = async (optionID: string) => {
    if (!poll?.id || !optionID || !canVote) return;

    try {
      setLoadingOption(optionID);
      await onVote(poll.id, optionID);
    } finally {
      setLoadingOption(null);
    }
  };

  const handleClose = async () => {
    if (!poll?.id || !onClose || !isTeacherOrAdmin) return;

    try {
      setClosing(true);
      await onClose(poll.id);
    } finally {
      setClosing(false);
    }
  };

  return (
    <View style={[styles.row, isMine ? styles.myRow : styles.otherRow]}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconBox}>
            <Ionicons name="bar-chart" size={18} color={BLUE} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Poll</Text>
            <Text style={styles.question}>{question}</Text>
          </View>
        </View>

        <View style={styles.options}>
          {options.map((option) => {
            const optionID = String(option.id);
            const optionText = option.text || option.option_text || "Option";
            const votes = Number(option.votes ?? option.vote_count ?? 0);
            const percent = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
            const selected = String(myVote) === optionID;
            const loading = loadingOption === optionID;

            return (
              <TouchableOpacity
                key={optionID}
                style={[
                  styles.option,
                  selected && styles.optionSelected,
                  !canVote && styles.optionDisabled,
                ]}
                disabled={!canVote || loading}
                onPress={() => handleVote(optionID)}
                activeOpacity={0.8}
              >
                <View style={styles.optionTop}>
                  <View style={styles.optionTextRow}>
                    {selected && (
                      <Ionicons name="checkmark-circle" size={16} color={GREEN} />
                    )}
                    <Text style={styles.optionText}>{optionText}</Text>
                  </View>

                  {loading ? (
                    <ActivityIndicator size="small" color={BLUE} />
                  ) : (
                    <Text style={styles.percent}>{percent}%</Text>
                  )}
                </View>

                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, { width: `${percent}%` }]} />
                </View>

                <Text style={styles.votes}>{votes} votes</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Text style={styles.total}>{totalVotes} total votes</Text>

          <View style={[styles.statusPill, isActive ? styles.activePill : styles.closedPill]}>
            <Text style={[styles.statusText, !isActive && styles.closedText]}>
              {isActive ? "Active" : "Closed"}
            </Text>
          </View>
        </View>

        {isTeacherOrAdmin && isActive && (
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleClose}
            disabled={closing}
          >
            {closing ? (
              <ActivityIndicator size="small" color={RED} />
            ) : (
              <>
                <Ionicons name="close-circle-outline" size={16} color={RED} />
                <Text style={styles.closeText}>Close Poll</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default memo(PollCard);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginVertical: 6,
    alignItems: "flex-end",
  },
  myRow: {
    justifyContent: "flex-end",
  },
  otherRow: {
    justifyContent: "flex-start",
  },
  card: {
    width: "88%",
    maxWidth: 360,
    backgroundColor: BG,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  header: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  label: {
    fontSize: 11,
    fontWeight: "900",
    color: BLUE,
    marginBottom: 3,
  },
  question: {
    fontSize: 15,
    fontWeight: "900",
    color: TEXT,
    lineHeight: 21,
  },
  options: {
    gap: 9,
  },
  option: {
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#F8FAFC",
    borderRadius: 15,
    padding: 10,
  },
  optionSelected: {
    borderColor: GREEN,
    backgroundColor: "#F0FDF4",
  },
  optionDisabled: {
    opacity: 0.95,
  },
  optionTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  optionTextRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  optionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "900",
    color: TEXT,
  },
  percent: {
    fontSize: 12,
    fontWeight: "900",
    color: BLUE,
  },
  progressBg: {
    height: 7,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
    marginTop: 9,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: BLUE,
  },
  votes: {
    marginTop: 5,
    fontSize: 10,
    fontWeight: "800",
    color: MUTED,
  },
  footer: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  total: {
    fontSize: 11,
    fontWeight: "900",
    color: MUTED,
  },
  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  activePill: {
    backgroundColor: "#DCFCE7",
  },
  closedPill: {
    backgroundColor: "#FEE2E2",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "900",
    color: GREEN,
  },
  closedText: {
    color: RED,
  },
  closeBtn: {
    marginTop: 12,
    height: 36,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  closeText: {
    fontSize: 12,
    fontWeight: "900",
    color: RED,
  },
});