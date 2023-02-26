<script lang="ts">
    import Textfield from '@smui/textfield';
    import Button from '@smui/button';
	import { tokenStore } from "../stores/session";
    let studentid = "";
    let password = "";
    let loading = false;

    const handleSubmit = () => {
        loading = true;
        fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                studentid,
                password,
            }),
        })
        .then((res) => res.json())
        .then((data) => {
            console.log(data);
            tokenStore.update((u) => u = data.ACIXSTORE);
            // window.location.href = "/user";
            window.location.href = (`https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/select_entry.php?ACIXSTORE=${data.ACIXSTORE}&hint=${studentid}`);
            loading = false;
        })
        .catch((err) => {
            console.log(err);
            loading = false;
        });
    };

</script>

<div class="grid grid-rows-[14px_auto_24px] w-screen h-screen">
    <div class="bg-[#5B2F7C]"></div>
    <div class="grid place-items-center">
        <div class="grid w-[820px] grid-cols-2 shadow-lg">
            <div class="flex flex-col space-y-5 bg-[#5B2F7C] p-14">
                <div class="space-y-1">
                    <h1 class="text-[32px] font-semibold text-white">
                        Login with your NTHU Credentials
                    </h1>
                    <h1 class="text-[20px] font-semibold text-white">
                        請使用國立清華大學賬號登入
                    </h1>
                </div>
                <Textfield
                    variant="filled"
                    bind:value={studentid}
                    label="帳號 Student ID"
                    >
                </Textfield>
                <Textfield
                    type="password"
                    variant="filled"
                    bind:value={password}
                    label="密碼 Password"
                    >
                </Textfield>
                <div class="flex justify-between">
                    <div class="flex flex-col">
                        <a class="text-[rgba(255,255,255,0.56)] font-thin" href="https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/PC/1/1.3/PC13001.php?lang=C">忘記密碼 -></a>
                        <a class="text-[rgba(255,255,255,0.56)] font-thin" href="https://www.ccxp.nthu.edu.tw/ccxp/INQUIRE/forget.php?lang=C">無法登入 -></a>
                    </div>
                    <button class="w-[140px] h-[50px] grid place-items-center bg-[#863DBD]" on:click={handleSubmit}>
                        {#if loading}
                            <div class="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                        {:else}
                            <span class="text-white text-[14px] font-semibold">登入 Login</span>
                        {/if}
                    </button>
                </div>
            </div>
            <div class="flex flex-col items-center space-y-4 justify-between pb-14 pt-4">
                <img src="/NTHU_Round_Seal.png" class="w-[200px] h-[200px]" alt="nthu_logo">
                <a class="w-[140px] h-[50px] grid place-items-center bg-[#2F577C]" href="https://sso.nd.nthu.edu.tw/index.do" >
                    <span class="text-white text-[14px] font-semibold">南大系統 -></span>
                </a>
            </div>
        </div>
        
    </div>    
</div>


