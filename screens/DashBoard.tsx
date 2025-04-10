import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import ChatsScreen from "./UsersScreen";
import GroupsScreen from "./GroupsScreen";
import FriendRequestsScreen from "./FriendRequestsScreen";
import SettingsScreen from "./SettingsScreen";

const { width } = Dimensions.get('window');

type TabType = "FRIENDS" | "GROUPS" | "REQUESTS" | "SETTINGS";

const DashBoard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const tabs: TabType[] = ["FRIENDS", "GROUPS", "REQUESTS", "SETTINGS"];

  const handleTabPress = (index: number): void => {
    setActiveTab(index);
    scrollViewRef.current?.scrollTo({ x: width * index, animated: true });
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>): void => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / width);
    if (newIndex !== activeTab) {
      setActiveTab(newIndex);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        {tabs.map((tab, index) => (
          <TouchableOpacity key={tab} onPress={() => handleTabPress(index)} style={styles.tab} testID={`tab-${tab.toLowerCase()}`}>
            <Text style={[styles.tabText, activeTab === index && styles.activeTabText]}>{tab}</Text>
            {activeTab === index && (<View style={styles.activeTabIndicator} />)}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        style={styles.contentContainer}
        testID="dashboard-scrollview"
      >
        <View style={styles.page} testID="friends-screen">
          <ChatsScreen />
        </View>
        <View style={styles.page} testID="groups-screen">
          <GroupsScreen />
        </View>
        <View style={styles.page} testID="requests-screen">
          <FriendRequestsScreen />
        </View>
        <View style={styles.page} testID="settings-screen">
          <SettingsScreen />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    backgroundColor: "#075E54"
  },
  tab: {
    alignItems: "center",
    flex: 1
  },
  tabText: {
    fontSize: 16,
    color: "#aaa",
    fontWeight: "bold"
  },
  activeTabText: {
    color: "#fff"
  },
  activeTabIndicator: {
    height: 3,
    width: "80%",
    backgroundColor: "#fff",
    marginTop: 4,
    borderRadius: 2
  },
  contentContainer: {
    flex: 1,
  },
  page: {
    width: width,
  },
});

export default DashBoard;