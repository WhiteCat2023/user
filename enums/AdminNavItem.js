import { MenuIcon } from "@/components/ui/icon";
import {LayoutPanelLeft, ClipboardMinus, Map, Bell, CircleUserRound} from 'lucide-react-native';


export const AdminNavItem = Object.freeze(
    [
      { 
        icon: LayoutPanelLeft,
        name: "Dashboard",
        route: "/admin"
      },
      {
        icon:ClipboardMinus,
        name: "Reports",
        route: "/admin/reports"
      },
      {
        icon: Map,
        name: "Map",
        route: "/admin/map"
      },
      {
        icon: Bell,
        name: "Notifications",
        route: "/admin/notifications"
      },
      {
        icon: CircleUserRound,
        name: "Profile",
        route: "/admin/profile"
      },
    ]
)