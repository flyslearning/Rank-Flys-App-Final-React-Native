import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  PersonalizedClassroomDetailsData,
  PersonalizedClassroomHomeData,
} from "../api/personalizedClassroom.api";

const PC_DETAILS_KEY = "personalized_classroom_details";
const PC_HOME_KEY = "personalized_classroom_home";

export const PersonalizedClassroomDb = {
  async saveDetails(data: PersonalizedClassroomDetailsData) {
    try {
      await AsyncStorage.setItem(PC_DETAILS_KEY, JSON.stringify(data));
    } catch (error) {
      console.log("SAVE PC DETAILS CACHE ERROR:", error);
    }
  },

  async getDetails(): Promise<PersonalizedClassroomDetailsData | null> {
    try {
      const raw = await AsyncStorage.getItem(PC_DETAILS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.log("GET PC DETAILS CACHE ERROR:", error);
      return null;
    }
  },

  async saveHome(data: PersonalizedClassroomHomeData) {
    try {
      await AsyncStorage.setItem(PC_HOME_KEY, JSON.stringify(data));
    } catch (error) {
      console.log("SAVE PC HOME CACHE ERROR:", error);
    }
  },

  async getHome(): Promise<PersonalizedClassroomHomeData | null> {
    try {
      const raw = await AsyncStorage.getItem(PC_HOME_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.log("GET PC HOME CACHE ERROR:", error);
      return null;
    }
  },

  async clear() {
    try {
      await AsyncStorage.multiRemove([PC_DETAILS_KEY, PC_HOME_KEY]);
    } catch (error) {
      console.log("CLEAR PC CACHE ERROR:", error);
    }
  },
};