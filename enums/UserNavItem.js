import {LayoutPanelLeft, ClipboardMinus, Map, Bell, CircleUserRound} from 'lucide-react-native';

export const UserNavItem = Object.freeze([
    
    { 
        icon: LayoutPanelLeft,
        name: "Dashboard",
        route: "/user"
    },
    {
        icon: ClipboardMinus,
        name: "Reports",
        route: "/user/reports"
    },
    // {
    //     name: "Map",
    //     route: "/admin/map"
    // },
    {
        icon: Bell,
        name: "Notifications",
        route: "/user/notifications"
    },
    {
        icon: CircleUserRound,
        name: "Profile",
        route: "/user/profile"
    },
    
])