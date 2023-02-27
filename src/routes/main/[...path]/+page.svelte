<script lang="ts">
	import { page } from "$app/stores";
	import { session } from "../../../stores/session";

    //get path from url
    console.log($session)
    console.log($page.params.path);
</script>
{#if $session != null}
{#if $page.params.path == 'edit'}
<iframe src="https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/TS/STU/1/1.3/TSSTU1130.php?ACIXSTORE={$session?.token}" class="w-full h-screen"></iframe>
{/if}
{/if}

<!-- https://www.ccxp.nthu.edu.tw/ccxp/PICS/getphoto.php?ACIXSTORE=4q8k0pof09jm45uhuoghc09q90&pn=111060062 -->
