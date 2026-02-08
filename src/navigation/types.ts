export type RootStackParamList = {
    Login: undefined;
    SignUp: undefined;
    VerifyEmail: { email: string; isPilgrim?: boolean };
    CreateGroup: undefined;
    GroupDetails: { groupId: string; groupName: string };
    PilgrimDashboard: { userId: string };
    PilgrimProfile: { userId: string };
    ModeratorDashboard: { userId: string };
    Notifications: undefined;
    EditProfile: undefined;
    AdminDashboard: { userId: string };
    PilgrimSignUp: undefined;
    PilgrimMessagesScreen: { groupId: string; groupName: string };
    JoinGroup: { userId: string };
    CommunicationScreen: { groupId: string };
};
