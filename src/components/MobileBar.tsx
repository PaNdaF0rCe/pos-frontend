import { CiViewList, CiCreditCard1 } from "react-icons/ci";
import { BiCategory } from "react-icons/bi";
import { MdOutlinePointOfSale, MdOutlineHistory, MdOutlineAssessment } from "react-icons/md";
import { Link, useLocation } from "react-router-dom";

export default function MobileBar() {
  const { pathname } = useLocation();
  return (
    <div className="md:hidden print:hidden bg-white z-10 fixed bottom-0 left-0 w-full h-16 border flex justify-around items-center px-4">
      <Link to="/">
        <MdOutlinePointOfSale
          className={`h-8 w-8 ${pathname === "/" ? "text-green-600" : "text-neutral-500"}`}
        />
      </Link>
      <Link to="/orders">
        <MdOutlineHistory
          className={`h-8 w-8 ${pathname.startsWith("/orders") ? "text-green-600" : "text-neutral-500"}`}
        />
      </Link>
      <Link to="/credits">
        <CiCreditCard1
          className={`h-8 w-8 ${pathname.startsWith("/credits") ? "text-green-600" : "text-neutral-500"}`}
        />
      </Link>
      <Link to="/admin">
        <CiViewList
          className={`h-8 w-8 ${pathname === "/admin" ? "text-green-600" : "text-neutral-500"}`}
        />
      </Link>
      <Link to="/admin/categories">
        <BiCategory
          className={`h-8 w-8 ${pathname.startsWith("/admin/categories") ? "text-green-600" : "text-neutral-500"}`}
        />
      </Link>
      <Link to="/reports">
        <MdOutlineAssessment
          className={`h-8 w-8 ${pathname.startsWith("/reports") ? "text-green-600" : "text-neutral-500"}`}
        />
      </Link>
    </div>
  );
}
