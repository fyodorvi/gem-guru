import {Purchase} from "./purchase";
import {ProfileSettings} from "./profileSettings";

export interface UserData {
    purchases: Purchase[];
    profileSettings: ProfileSettings;
}