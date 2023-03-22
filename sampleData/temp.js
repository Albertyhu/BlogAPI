function HandleSignUpSubmit(evt, elements, uploadedFile, apiURL, dispatchFunctions, resetErrorFields) {
    evt.preventDefault();
    const {
        RegistrationForm,
        NameInput,
        EmailInput,
        PasswordInput,
        ConfirmInput,
    } = elements;
    var isValid = true;
    var errMessage = "Error: ";
    if (isValid) {
        const data = {
            username: NameInput.value,
            email: EmailInput.value,
            password: PasswordInput.value,
            profile_pic: uploadedFile,
            confirm_password: ConfirmInput.value
        }
        resetErrorFields();
        SubmitRegistration(data, apiURL, dispatchFunctions);

    }
    else
        console.log("RegistrationHooks Error: ", errMessage)
}

async function SubmitRegistration(data, apiURL, dispatchFunctions) {
    console.log("Registrating user")
    const {
        username,
        email,
        password,
        confirm_password,
        profile_pic,
    } = data;
    console.log("profile_pic: ", profile_pic)
    const formData = new FormData;
    formData.append("username", username);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("confirm_password", confirm_password);
    formData.append("profile_pic", profile_pic);
    for (var key of formData.entries()) {
        console.log(key[0] + ', ' + key[1])
    }
    const {
        GoHome,
        toggleDisplayAccountLink,
        setNewUser,
    } = dispatchFunctions;

    await fetch(apiURL, {
        method: "POST",
        headers: { "Content-Type": "multipart/form-data" },
        body: formData
    })
        .then(async response => {
            if (response.ok) {
                console.log("Registration is successful.")
                await response.json()
                    .then(data => {
                        localStorage.setItem("user", JSON.stringify(data.user))
                        localStorage.setItem('token', data.token)
                        //setNewUser and toggleDisplayAccoutLink updates the header bar to contain
                        //data about the logged in user
                        setNewUser(data.user)
                        toggleDisplayAccountLink(true),
                            GoHome();

                    })
            }
            else {
                const result = await response.json()
                console.log("Registration failed with status code: ", result.error)
                RenderErrorArray(result.error, dispatchFunctions)
            }
        })
        .catch(error => {
            console.log("SubmitRegistration error: ", error)
        })
}
