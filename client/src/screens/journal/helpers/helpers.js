import { SAVE_ICON_COLORS } from "screens/journal/constants/constants";
import axios from "axios";
import { DATABASE_URL } from "constants";


export const getSaveButtonColor = (loggedGoalToday, goalData, goal) => {
  if (
    loggedGoalToday &&
    goalData.length &&
    (goalData[0].goalValue - goal[0].goalValue !== 0 ||
      goalData[0].behaviorValue - goal[0].behaviorValue !== 0 ||
      goalData[0].reflection !== goal[0].reflection)
  ) {
    return SAVE_ICON_COLORS.YELLOW;
  } else if (!goalData.length || !loggedGoalToday) {
    return SAVE_ICON_COLORS.GREEN;
  } else if (
    goalData[0].goalValue - goal[0].goalValue === 0 &&
    goalData[0].behaviorValue - goal[0].behaviorValue === 0 &&
    goalData[0].reflection === goal[0].reflection
  ) {
    return SAVE_ICON_COLORS.RED;
  } else {
    return "auto";
  }
};

export const createChatbotRequest = (
  goal,
  setGoal,
  user,
  date,
  setGoalResponseLoading,
  selectedItems = {},
  goalInputs = {},
  behaviorInputs = {},
  totalExpectedTime = {},
  totalTrackedTime = {}
) => {
  setGoalResponseLoading(true);

  const goalType = goal[0].goalType;
  const reflection = goal[0].reflection || "None";
  let additionalInfo = "";
  let goalMet = false;
  let recommendedValue = "";
  let personalGoalMet = false;
  let actualValue = ""; 

  if (!goalInputs || Object.keys(goalInputs).length === 0 || !selectedItems || Object.keys(selectedItems).length === 0) {
    console.error("No goal or selected items found. Ensure the user has selected items in the popups.");
    setGoalResponseLoading(false);
    return;
  }

  // Helper function to calculate time (hours and minutes) for tracking
  const formatTime = (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  // Handling custom "Other" activities
  const handleCustomActivity = (activityName, section) => {
    return `${activityName}: Expected ${goalInputs?.[section]?.[activityName]?.hours || 0}h ${goalInputs?.[section]?.[activityName]?.minutes || 0}m, 
            Tracked ${behaviorInputs?.[section]?.[activityName]?.hours || 0}h ${behaviorInputs?.[section]?.[activityName]?.minutes || 0}m`;
  };

  // Activity tracking
  if (goalType === "activity") {
    const activities = selectedItems?.activity || [];
    additionalInfo = `Activities: ${activities.map(item =>
      handleCustomActivity(item, 'activity')
    ).join(", ")}`;
    
    recommendedValue = "60 minutes";
    const totalMinutesTracked = totalTrackedTime?.activity || 0;
    actualValue = formatTime(totalMinutesTracked);
    goalMet = totalTrackedTime?.activity >= 60; // Recommended goal is 60 minutes
    personalGoalMet = totalTrackedTime?.activity >= (goal[0].goalValue * 60); 
  }

  // Screentime tracking
  else if (goalType === "screentime") {
    const screentimeActivities = selectedItems?.screentime || [];
    additionalInfo = `Screentime Activities: ${screentimeActivities.map(item =>
      handleCustomActivity(item, 'screentime')
    ).join(", ")}`;
  
    recommendedValue = "120 minutes";
    const totalMinutesTracked = totalTrackedTime?.screentime || 0;
    actualValue = formatTime(totalMinutesTracked);
  
    const schoolWorkRelated = screentimeActivities.some(item => item.toLowerCase().includes("school") || item.toLowerCase().includes("work"));
  
    goalMet = schoolWorkRelated || totalMinutesTracked <= 120; // Recommended goal is 120 minutes
    personalGoalMet = totalMinutesTracked <= (goal[0].goalValue * 60); 
  }

  // Eating fruits and vegetables tracking
  else if (goalType === "eating") {
    const eatingItems = selectedItems?.eating || [];
    additionalInfo = `Eating Activities: ${eatingItems.map(item =>
      handleCustomActivity(item, 'eating')
    ).join(", ")}`;
    
    recommendedValue = "5 servings";
    actualValue = `${totalTrackedTime?.eating || 0} servings`;
    goalMet = totalTrackedTime?.eating >= 5; // Recommended goal is 5 servings
    personalGoalMet = totalTrackedTime?.eating >= goal[0].goalValue; 
  }

  // Sleep tracking
  else if (goalType === "sleep") {
    const totalMinutesTracked = totalTrackedTime?.sleep || 0;
    actualValue = formatTime(totalMinutesTracked);
    recommendedValue = "9 hours";

    const bedTime = goalInputs?.sleep?.["Expected Sleep"]?.bedTime || "";
    const wakeUpTime = goalInputs?.sleep?.["Expected Sleep"]?.wakeUpTime || "";
    const trackedBedTime = behaviorInputs?.sleep?.["Actual Sleep"]?.bedTime || "";
    const trackedWakeUpTime = behaviorInputs?.sleep?.["Actual Sleep"]?.wakeUpTime || "";

    additionalInfo = `Expected Sleep: Bed Time - ${bedTime}, Wake Up Time - ${wakeUpTime}, 
      Tracked Sleep: Bed Time - ${trackedBedTime}, Wake Up Time - ${trackedWakeUpTime}`;
    
    goalMet = totalTrackedTime?.sleep >= (9 * 60); // Recommended goal is 9 hours of sleep
    personalGoalMet = totalTrackedTime?.sleep >= (goal[0].goalValue * 60); 
  }

  // Send the request to the chatbot
  axios
    .post(`${DATABASE_URL}/chatbot`, {
      prompt: [
        {
          role: "system",
          content: `Provide feedback based on the user's actual behavior compared to both their set personal goals and recommended goals. Do not respond using percentages`,
        },
        {
          role: "user",
          content: `Goal Type: ${goalType}, Recommended Value: ${recommendedValue}, Personal Goal Met: ${personalGoalMet ? "Yes" : "No"}, Recommended Goal Met: ${goalMet ? "Yes" : "No"}, Actual Value: ${actualValue}, ${additionalInfo}, Reflection: ${reflection}`,
        },
      ],
    })
    .then((response) => {
      console.log(`Chatbot response for ${goalType}:`, response.data.chat_reply);
      setGoal((prevGoal) => {
        const updatedGoal = prevGoal.map((g) => ({
          ...g,
          feedback: response.data.chat_reply,
        }));
        return updatedGoal;
      });
      setGoalResponseLoading(false);
    })
    .catch((error) => {
      console.error(error);
      setGoalResponseLoading(false);
    });
};





const calculateSleepDuration = (bedTime, wakeUpTime) => {
  if (!bedTime || !wakeUpTime) return "";

  const [bedHour, bedMinute] = bedTime.split(":").map(Number);
  const [wakeHour, wakeMinute] = wakeUpTime.split(":").map(Number);

  const bedDate = new Date();
  bedDate.setHours(bedHour, bedMinute);

  const wakeDate = new Date();
  wakeDate.setHours(wakeHour, wakeMinute);

  if (wakeDate < bedDate) {
    wakeDate.setDate(wakeDate.getDate() + 1);
  }

  const sleepDurationInMinutes = (wakeDate - bedDate) / (1000 * 60);
  const hours = Math.floor(sleepDurationInMinutes / 60);
  const minutes = sleepDurationInMinutes % 60;

  return `${hours} hours and ${minutes} minutes`;
};
export async function updateBehaviorValue(
  user,
  newGoalValue,
  newBehaviorValue,
  newReflection,
  setGoal,
  currentGoal,
  goalData,
  goalType,
  date,
  recommendedValue,
  activities = {},
  servings = { fruits: 0, vegetables: 0 },
  sleep = { bedGoal: 0, wakeUpGoal: 0, bedBehavior: 0, wakeUpBehavior: 0 }
) {
  setGoal((prevGoal) => {
    const updatedBehaviorGoal = prevGoal.map((goal) => {
      const updatedGoal = { ...goal, behaviorValue: +newBehaviorValue };
      axios
        .post(`${DATABASE_URL}/goals`, {
          user: user._id,
          name: user.name,
          goalType: goalType,
          goalValue: +newGoalValue,
          behaviorValue: newBehaviorValue,
          goalStatus: goalData.length
            ? newBehaviorValue > goalData[0].goalValue &&
              goalType === "screentime"
              ? "no"
              : newBehaviorValue >= goalData[0].goalValue &&
                goalType !== "screentime"
              ? "yes"
              : "no"
            : newBehaviorValue > currentGoal[0].goalValue &&
              goalType === "screentime"
            ? "no"
            : newBehaviorValue >= currentGoal[0].goalValue &&
              goalType !== "screentime"
            ? "yes"
            : "no",
          reflection: newReflection,
          dateToday: new Date(),
          recommendedValue: recommendedValue,
        })
        .catch((error) => {
          console.error(error);
        });
      axios
        .post(`${DATABASE_URL}/behaviors`, {
          user: user._id,
          name: user.name,
          goalType: goalType,
          date: date,
          dateToday: new Date(),
          goalValue: +newGoalValue,
          behaviorValue: newBehaviorValue,
          goalStatus: goalData.length
            ? newBehaviorValue > goalData[0].goalValue &&
              goalType === "screentime"
              ? "no"
              : newBehaviorValue >= goalData[0].goalValue &&
                goalType !== "screentime"
              ? "yes"
              : "no"
            : newBehaviorValue > currentGoal[0].goalValue &&
              goalType === "screentime"
            ? "no"
            : newBehaviorValue >= currentGoal[0].goalValue &&
              goalType !== "screentime"
            ? "yes"
            : "no",
          divInfo1: currentGoal[0].divInfo1,
          divInfo2: currentGoal[0].divInfo2,
          reflection: newReflection,
          recommendedValue: recommendedValue,
          feedback: currentGoal[0].feedback,
        })
        .catch((error) => {
          console.error(error);
        });
      return updatedGoal;
    });
    return updatedBehaviorGoal;
  });
}