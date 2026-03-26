import BrandHeader from "./BrandHeader";
import FeatureList from "./FeatureList";
import StatsGrid from "./StatsGrid";

function LeftSidebar() {
  return (
    <div className="hidden lg:flex flex-col gap-8 animate-[slide-up_0.7s_cubic-bezier(0.16,1,0.3,1)_both]">
      <BrandHeader />
      <FeatureList />
      <StatsGrid />
    </div>
  );
}

export default LeftSidebar;