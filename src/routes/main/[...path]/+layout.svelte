
<script lang="ts">
	import { goto } from "$app/navigation";
	import { onMount, onDestroy } from "svelte";
	import { session } from "../../../stores/session";

    let timeInterval: NodeJS.Timer;
    onMount(() => {
        if ($session == null) goto('/')
        else {
            const updatetime = () => {
                fetch(`/api/time?account=${$session!.studentid}&ACIXSTORE=${$session!.token}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                })
                .then(res => {
                    if(!res.ok) goto('/')
                    return res.json()
                })
                .then(data => {
                    console.log(data)
                })
            }
            updatetime();
            timeInterval = setInterval(updatetime, 5000);
        }
    })
    onDestroy(() => clearInterval(timeInterval));
</script>
{#if $session != null}
<layout class="grid grid-cols-[16rem_auto] grid-rows-[64px_auto] h-screen w-screen">
    <div class="p-2">
        <img src="https://www.ccxp.nthu.edu.tw/ccxp/PICS/getphoto.php?cn=TS&pn={$session.studentid}&ACIXSTORE={$session.token}" alt="pfp" />
        <h1>Your Name</h1>
    </div>
    <div>
        <h1>Settings</h1>
    </div>
    <nav>
        <a>E-Class</a>
        <a href="/main/edit">Edit</a>
    </nav>
    <slot />
</layout>
{/if}