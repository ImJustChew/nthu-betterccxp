<script lang="ts">
    import Button from '@smui/button';
	import { tokenStore } from "../../stores/session";
    let token: string | null = null;
    const handleLogout = () => {
        window.location.href = '/';
    }

    tokenStore.subscribe((value) => {
        console.log(value);
        token = value;
    });

</script>

<div>
    <h1 class="text-3xl font-bold underline">
        {token}
    </h1>
    <Button
        class="shaped-outlined"
        variant="outlined"
        on:click={handleLogout}>
        Logout
    </Button>
</div>