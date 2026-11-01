import { useState } from "react";
import { api } from "../api";

export default function ChangePassword() {

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();

        setMessage("");
        setError("");

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match");
            return;
        }

        if (newPassword.length < 8) {
            setError("Password must contain at least 8 characters");
            return;
        }

        try {
            setLoading(true);

            const response = await api("/auth/change-password", {
                method: "POST",
                body: {
                    currentPassword,
                    newPassword
                }
            });

            setMessage(response.message);

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="change-password">

            <h2>Change Password</h2>

            <form onSubmit={handleSubmit}>

                <div>
                    <label>Current Password</label>
                    <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) =>
                            setCurrentPassword(e.target.value)
                        }
                        required
                    />
                </div>

                <div>
                    <label>New Password</label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) =>
                            setNewPassword(e.target.value)
                        }
                        minLength={8}
                        required
                    />
                </div>

                <div>
                    <label>Confirm New Password</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) =>
                            setConfirmPassword(e.target.value)
                        }
                        minLength={8}
                        required
                    />
                </div>

                {error && (
                    <p style={{ color: "red" }}>{error}</p>
                )}

                {message && (
                    <p style={{ color: "green" }}>{message}</p>
                )}

                <button type="submit" disabled={loading}>
                    {loading ? "Updating..." : "Update Password"}
                </button>

            </form>
        </div>
    );
}