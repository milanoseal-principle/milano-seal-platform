import { redirect } from 'next/navigation';
import { governanceActor } from '@/lib/control-plane/governance/server';
import { GovernanceBoardRoom } from '@/components/control-plane/GovernanceBoardRoom';
export const dynamic='force-dynamic';
export const metadata={title:'Corporate Board Room — The Milano Seal™',robots:{index:false,follow:false}};
export default async function BoardRoomPage(){try{await governanceActor();}catch{redirect('/login?next=/dashboard/control-plane/board-room');}return <GovernanceBoardRoom/>;}
