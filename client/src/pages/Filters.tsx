import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Filter, Save, Edit, Trash2 } from "lucide-react";

export default function Filters() {
  const utils = trpc.useUtils();
  
  const { data: categories, isLoading: categoriesLoading } = trpc.filters.getCategories.useQuery();
  const { data: filters } = trpc.filters.getFilters.useQuery();
  
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [colors, setColors] = useState<string>("");
  const [sizes, setSizes] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [keywords, setKeywords] = useState<string>("");
  const [editingFilterId, setEditingFilterId] = useState<number | null>(null);

  const saveFilterMutation = trpc.filters.saveFilter.useMutation({
    onSuccess: () => {
      toast.success("Filter saved successfully!");
      utils.filters.getFilters.invalidate();
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save filter");
    },
  });

  const updateFilterMutation = trpc.filters.updateFilter.useMutation({
    onSuccess: () => {
      toast.success("Filter updated successfully!");
      utils.filters.getFilters.invalidate();
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update filter");
    },
  });

  const deleteFilterMutation = trpc.filters.deleteFilter.useMutation({
    onSuccess: () => {
      toast.success("Filter deleted successfully!");
      utils.filters.getFilters.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete filter");
    },
  });

  const resetForm = () => {
    setSelectedCategory("all");
    setColors("");
    setSizes("");
    setMinPrice("");
    setMaxPrice("");
    setKeywords("");
    setEditingFilterId(null);
  };

  const loadFilterForEdit = (filter: any) => {
    setEditingFilterId(filter.id);
    setSelectedCategory(filter.categoryId ? filter.categoryId.toString() : "all");
    setColors(filter.colors || "");
    setSizes(filter.sizes || "");
    setMinPrice(filter.minPrice || "");
    setMaxPrice(filter.maxPrice || "");
    setKeywords(filter.keywords || "");
    // Scroll to form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveFilter = () => {
    const colorsArray = colors.trim() ? colors.split(",").map(c => c.trim()).filter(Boolean) : null;
    const sizesArray = sizes.trim() ? sizes.split(",").map(s => s.trim()).filter(Boolean) : null;

    const filterData = {
      categoryId: selectedCategory === "all" ? null : parseInt(selectedCategory),
      colors: colorsArray,
      sizes: sizesArray,
      minPrice: minPrice ? parseFloat(minPrice) : null,
      maxPrice: maxPrice ? parseFloat(maxPrice) : null,
      keywords: keywords.trim() || null,
    };

    if (editingFilterId) {
      updateFilterMutation.mutate({ id: editingFilterId, ...filterData });
    } else {
      saveFilterMutation.mutate(filterData);
    }
  };

  const handleDeleteFilter = (filterId: number) => {
    deleteFilterMutation.mutate({ id: filterId });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Product Filters</h1>
          <p className="text-muted-foreground mt-2">
            Set your preferences to receive notifications only for products that match your criteria.
          </p>
        </div>

        {/* Create New Filter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Create New Filter
            </CardTitle>
            <CardDescription>
              Define specific criteria for the products you want to monitor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Category Selection */}
              <div className="space-y-2">
                <Label htmlFor="category">Bag Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categoriesLoading ? (
                      <SelectItem value="loading" disabled>Loading...</SelectItem>
                    ) : categories && categories.length > 0 ? (
                      categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No categories available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select a specific bag type or leave blank for all
                </p>
              </div>

              {/* Colors */}
              <div className="space-y-2">
                <Label htmlFor="colors">Preferred Colors</Label>
                <Input
                  id="colors"
                  placeholder="e.g., Black, Gold, Etoupe"
                  value={colors}
                  onChange={(e) => setColors(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated list of colors
                </p>
              </div>

              {/* Sizes */}
              <div className="space-y-2">
                <Label htmlFor="sizes">Preferred Sizes</Label>
                <Input
                  id="sizes"
                  placeholder="e.g., 25, 30, PM"
                  value={sizes}
                  onChange={(e) => setSizes(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated list of sizes
                </p>
              </div>

              {/* Price Range */}
              <div className="space-y-2">
                <Label>Price Range</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                  <span className="flex items-center">-</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Set your budget range (optional)
                </p>
              </div>
            </div>

            {/* Keywords */}
            <div className="space-y-2">
              <Label htmlFor="keywords">Additional Keywords</Label>
              <Input
                id="keywords"
                placeholder="e.g., Birkin, Kelly, Constance"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Optional search terms to refine your results
              </p>
            </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleSaveFilter} 
                  disabled={saveFilterMutation.isPending || updateFilterMutation.isPending}
                  className="flex-1"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {editingFilterId ? "Update Filter" : "Save Filter"}
                </Button>
                {editingFilterId && (
                  <Button 
                    onClick={resetForm} 
                    variant="outline"
                  >
                    Cancel
                  </Button>
                )}
              </div>
          </CardContent>
        </Card>

        {/* Existing Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Your Active Filters</CardTitle>
            <CardDescription>
              Currently configured product filters
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filters && filters.length > 0 ? (
              <div className="space-y-4">
                {filters.map((filter) => (
                  <div 
                    key={filter.id} 
                    className="border border-border rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">
                        Filter #{filter.id}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          filter.isActive ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'
                        }`}>
                          {filter.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => loadFilterForEdit(filter)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Filter?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This filter will be permanently deleted.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteFilter(filter.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    <div className="grid gap-2 text-sm">
                      {filter.categoryId && (
                        <p><span className="text-muted-foreground">Category:</span> {categories?.find(c => c.id === filter.categoryId)?.name || `ID: ${filter.categoryId}`}</p>
                      )}
                      {filter.colors && (
                        <p><span className="text-muted-foreground">Colors:</span> {filter.colors}</p>
                      )}
                      {filter.sizes && (
                        <p><span className="text-muted-foreground">Sizes:</span> {filter.sizes}</p>
                      )}
                      {(filter.minPrice || filter.maxPrice) && (
                        <p>
                          <span className="text-muted-foreground">Price Range:</span>{' '}
                          {filter.minPrice || '0'} - {filter.maxPrice || '∞'}
                        </p>
                      )}
                      {filter.keywords && (
                        <p><span className="text-muted-foreground">Keywords:</span> {filter.keywords}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No filters configured yet. Create your first filter above to start receiving targeted notifications.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
