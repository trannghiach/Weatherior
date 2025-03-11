import { NavigateFunction } from "react-router-dom";


let navigate: NavigateFunction;

export const setNavigate = (fn: NavigateFunction) => {
    navigate = fn;
}

export default function customNavigate(
    path: string,
    options?: { state?: any; replace?: boolean }
) {
    if (navigate) {
        navigate(path, options);
    } else {
        console.error("Navigate function not set");
    }
}