"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useModalStore } from "@/lib/stores";
import { getCategories, deleteCategory } from "@/action/categoryActions";
import { checkAuth } from "@/action/authActions";
import Spinner from "@/components/Spinner";

interface Category {
  id: string;
  name: string;
}

export default function CategoryManagementModal() {
  const { isCategoryManagementOpen, closeCategoryManagement } = useModalStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null
  );

  // Check authentication and fetch categories when modal opens
  useEffect(() => {
    const verifySessionAndFetchCategories = async () => {
      if (!isCategoryManagementOpen) return;

      setIsLoading(true);
      try {
        const authResult = await checkAuth();
        setIsAuthenticated(authResult.success);

        if (authResult.success) {
          const categoryResult = await getCategories();
          if (categoryResult.success && categoryResult.data) {
            setCategories(categoryResult.data);
          } else {
            toast.error(categoryResult.message || "Failed to fetch categories");
          }
        } else {
          toast.error(authResult.message || "Session expired");
          closeCategoryManagement();
        }
      } catch (err) {
        console.error("Session or category fetch error:", err);
        toast.error("Authentication or category fetch error");
        setIsAuthenticated(false);
        closeCategoryManagement();
      } finally {
        setIsLoading(false);
      }
    };

    verifySessionAndFetchCategories();
  }, [isCategoryManagementOpen, closeCategoryManagement]);

  const handleOpenDeleteModal = (category: Category) => {
    setCategoryToDelete(category);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    setIsLoading(true);
    try {
      const result = await deleteCategory(categoryToDelete.name);
      if (result.success) {
        toast.success(result.message || "Category deleted successfully");
        setCategories(
          categories.filter((cat) => cat.name !== categoryToDelete.name)
        );
      } else {
        toast.error(result.message || "Failed to delete category");
      }
    } catch (error) {
      console.error("Delete category error:", error);
      toast.error("Failed to delete category");
    } finally {
      setIsLoading(false);
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
    }
  };

  if (!isAuthenticated && isCategoryManagementOpen) {
    return null;
  }

  return (
    <>
      <Dialog
        open={isCategoryManagementOpen}
        onOpenChange={(open) => !isLoading && closeCategoryManagement()}
      >
        <DialogContent className="max-w-[90vw] sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-semibold">
              Manage Categories
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              View and delete unused photo categories.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4">
            {isLoading ? (
              <div className="flex justify-center">
                <Spinner className="h-6 w-6" />
              </div>
            ) : categories.length > 0 ? (
              <ul className="space-y-2">
                {categories.map((category) => (
                  <li
                    key={category.id}
                    className="flex items-center justify-between p-2 bg-muted rounded-md"
                  >
                    <span className="text-sm sm:text-base">
                      {category.name}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDeleteModal(category)}
                      disabled={isLoading}
                      className="text-sm sm:text-base"
                    >
                      Delete
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm sm:text-base text-muted-foreground">
                No categories found
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl">
              Delete Category
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Are you sure you want to delete the category "
              {categoryToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <Button
              variant="outline"
              className="w-full sm:w-auto text-sm sm:text-base"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="w-full sm:w-auto text-sm sm:text-base"
              onClick={handleDeleteCategory}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
