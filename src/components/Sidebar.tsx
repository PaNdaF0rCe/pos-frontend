import { CiViewList } from "react-icons/ci";
import { BiCategory } from "react-icons/bi";
import { MdOutlinePointOfSale, MdOutlineHistory } from "react-icons/md";
import { Link, useLocation } from "react-router-dom";

type NavItem = {
  to: string;
  label: string;
  icon: React.ReactNode;
  exact?: boolean;
};

const navItems: NavItem[] = [
  { to: "/", label: "Checkout", icon: <MdOutlinePointOfSale className="h-5 w-5" />, exact: true },
  { to: "/orders", label: "Sales", icon: <MdOutlineHistory className="h-5 w-5" /> },
  { to: "/admin", label: "Items", icon: <CiViewList className="h-5 w-5" />, exact: true },
  { to: "/admin/categories", label: "Categories", icon: <BiCategory className="h-5 w-5" /> },
];

export default function Sidebar() {
  const { pathname } = useLocation();

  function isActive(item: NavItem) {
    return item.exact ? pathname === item.to : pathname.startsWith(item.to);
  }

  return (
    <div className="bg-white hidden md:block rounded-lg min-w-[220px] max-h-[750px] h-fit ml-[-4px] py-6">
      <div className="px-6 mb-8">
        <h1 className="font-extrabold text-xl leading-tight">
          <span className="text-green-700">Jason's</span>
          <br />
          <span className="text-neutral-800">Sports</span>
        </h1>
        <p className="text-xs text-neutral-400 mt-1">Point of Sale</p>
      </div>

      <div className="flex flex-col gap-1 px-3">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg font-semibold transition-colors ${
              isActive(item)
                ? "bg-green-600 text-white"
                : "text-neutral-700 hover:bg-neutral-100"
            }`}
          >
            {item.icon}
            <span className="text-sm">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
